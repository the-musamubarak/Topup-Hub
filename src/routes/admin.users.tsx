import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, PlusCircle, MinusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatNaira } from "@/lib/mock-data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminAdjustWallet } from "@/lib/wallet.functions";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type Row = { id: string; full_name: string | null; email: string | null; phone: string | null; balance_kobo: number };

function AdminUsers() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [target, setTarget] = useState<{ user: Row; direction: "credit" | "debit" } | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const adjust = useServerFn(adminAdjustWallet);

  const reload = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email, phone").limit(200);
    const { data: wallets } = await supabase.from("wallets").select("user_id, balance_kobo");
    const wm = new Map((wallets ?? []).map((w) => [w.user_id as string, w.balance_kobo as number]));
    setRows(((profiles ?? []) as Array<{ id: string; full_name: string | null; email: string | null; phone: string | null }>).map((p) => ({
      id: p.id, full_name: p.full_name, email: p.email, phone: p.phone, balance_kobo: wm.get(p.id) ?? 0,
    })));
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => rows.filter((u) => [u.full_name ?? "", u.email ?? "", u.phone ?? "", u.id].join(" ").toLowerCase().includes(q.toLowerCase())), [rows, q]);

  const doAdjust = async () => {
    if (!target) return;
    if (reason.trim().length < 3) return toast.error("Reason required");
    if (amount <= 0) return toast.error("Amount required");
    try {
      await adjust({ data: { target_user_id: target.user.id, amount_kobo: Math.round(amount * 100), reason, direction: target.direction } });
      toast.success(`${target.direction === "credit" ? "Credited" : "Debited"} ${formatNaira(amount)}`);
      setTarget(null); setAmount(0); setReason(""); reload();
    } catch (e) { toast.error(String((e as Error).message)); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Users & wallets</h1>
        <p className="text-sm text-muted-foreground">Search users and credit/debit wallets. Every change is logged to the audit trail.</p>
      </div>

      <div className="rounded-2xl bg-card p-3 shadow-card">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, or phone" className="h-10 rounded-xl pl-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        <div className="divide-y divide-border">
          {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No users found.</p>}
          {filtered.map((u) => (
            <div key={u.id} className="grid grid-cols-1 gap-2 px-4 py-3 text-sm lg:grid-cols-[1.4fr_1.6fr_1.1fr_0.9fr_auto] lg:items-center lg:gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-white shadow-brand">
                  {(u.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold">{u.full_name || "(no name)"}</span>
              </div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
              <div className="text-xs text-muted-foreground">{u.phone}</div>
              <div className="font-bold">{formatNaira(u.balance_kobo / 100)}</div>
              <div className="flex justify-end gap-1.5">
                <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs" onClick={() => setTarget({ user: u, direction: "credit" })}>
                  <PlusCircle size={13} className="mr-1" /> Credit
                </Button>
                <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs" onClick={() => setTarget({ user: u, direction: "debit" })}>
                  <MinusCircle size={13} className="mr-1" /> Debit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="rounded-3xl">
          {target && (
            <>
              <DialogHeader><DialogTitle>{target.direction === "credit" ? "Credit" : "Debit"} {target.user.full_name || target.user.email}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Amount (₦)</label>
                  <Input type="number" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value) || 0)} className="h-11 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Reason</label>
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Refund for failed data purchase" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setTarget(null)}>Cancel</Button>
                  <Button className="rounded-xl bg-gradient-brand text-white" onClick={doAdjust}>Confirm</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
