import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Undo2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatNaira } from "@/lib/mock-data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminRefundTransaction } from "@/lib/wallet.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/transactions")({
  component: AdminTransactions,
});

type Tx = {
  id: string; user_id: string; service_type: string; provider_id: string; plan_code: string | null;
  recipient: string; amount_kobo: number; cost_kobo: number; margin_kobo: number;
  status: "pending" | "success" | "failed" | "refunded"; clubkonnect_ref: string | null; created_at: string;
};

function AdminTransactions() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Tx["status"]>("all");
  const [rows, setRows] = useState<Tx[]>([]);
  const [refundTx, setRefundTx] = useState<Tx | null>(null);
  const [reason, setReason] = useState("");
  const refund = useServerFn(adminRefundTransaction);

  const reload = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("id, user_id, service_type, provider_id, plan_code, recipient, amount_kobo, cost_kobo, margin_kobo, status, clubkonnect_ref, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    setRows((data ?? []) as Tx[]);
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => rows.filter(
    (t) => (status === "all" || t.status === status)
      && (q === "" || [t.service_type, t.provider_id, t.recipient, t.clubkonnect_ref ?? "", t.id].join(" ").toLowerCase().includes(q.toLowerCase())),
  ), [rows, q, status]);

  const doRefund = async () => {
    if (!refundTx) return;
    if (reason.trim().length < 3) return toast.error("Reason required");
    try {
      await refund({ data: { transaction_id: refundTx.id, reason } });
      toast.success("Refund posted and wallet credited");
      setRefundTx(null); setReason(""); reload();
    } catch (e) { toast.error(String((e as Error).message)); }
  };

  const exportCsv = () => {
    const header = ["id", "user_id", "service", "provider", "plan", "recipient", "amount", "cost", "profit", "status", "ref", "created_at"];
    const lines = [header.join(",")].concat(filtered.map(t => [
      t.id, t.user_id, t.service_type, t.provider_id, t.plan_code ?? "", t.recipient,
      (t.amount_kobo / 100).toFixed(2), (t.cost_kobo / 100).toFixed(2), (t.margin_kobo / 100).toFixed(2),
      t.status, t.clubkonnect_ref ?? "", t.created_at,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `transactions-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Transactions</h1>
          <p className="text-sm text-muted-foreground">Refund transactions and export CSV.</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={exportCsv}><Download size={14} className="mr-1" /> CSV</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-card">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, recipient, service…" className="h-10 rounded-xl pl-9" />
        </div>
        {(["all", "success", "pending", "failed", "refunded"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
              status === s ? "bg-gradient-brand text-white shadow-brand" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >{s}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        <div className="divide-y divide-border">
          {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No transactions.</div>}
          {filtered.map((t) => (
            <div key={t.id} className="grid grid-cols-1 gap-2 px-4 py-3 text-sm lg:grid-cols-[1.4fr_1.4fr_0.8fr_0.9fr_0.9fr_auto] lg:items-center">
              <div>
                <p className="font-semibold text-foreground">{t.service_type} · {t.provider_id}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{t.id.slice(0, 8)}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                <div>{t.recipient}</div>
                <div>{t.clubkonnect_ref ?? "—"}</div>
              </div>
              <div><StatusBadge status={t.status === "refunded" ? "failed" : t.status} />{t.status === "refunded" && <span className="ml-1 text-[10px] font-bold text-muted-foreground">REFUNDED</span>}</div>
              <div className="font-bold">{formatNaira(t.amount_kobo / 100)}</div>
              <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("en-NG")}</div>
              <div className="flex justify-end">
                <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs" disabled={t.status === "refunded"} onClick={() => setRefundTx(t)}>
                  <Undo2 size={13} className="mr-1" /> Refund
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!refundTx} onOpenChange={(o) => !o && setRefundTx(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Refund transaction</DialogTitle></DialogHeader>
          {refundTx && (
            <div className="space-y-3">
              <p className="text-sm">Refund {formatNaira(refundTx.amount_kobo / 100)} to the user's wallet?</p>
              <Textarea placeholder="Reason (required, shown in audit log)" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setRefundTx(null)}>Cancel</Button>
                <Button className="rounded-xl bg-gradient-brand text-white" onClick={doRefund}>Confirm refund</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
