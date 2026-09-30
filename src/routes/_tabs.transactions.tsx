import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { ServiceIcon } from "@/components/service-icon";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatNaira, type Transaction } from "@/lib/mock-data";
import { getMyTransactions } from "@/lib/wallet.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_tabs/transactions")({
  head: () => ({ meta: [{ title: "Transactions — TopUp Hub" }] }),
  component: Transactions,
});

const tabs = [
  { key: "all", label: "All" },
  { key: "airtime", label: "Airtime" },
  { key: "data", label: "Data" },
  { key: "cable", label: "Cable TV" },
  { key: "electricity", label: "Electricity" },
  
] as const;

function groupByDate(txs: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  txs.forEach((t) => {
    const d = new Date(t.date);
    const today = new Date();
    const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    const label =
      diff === 0 ? "Today" : diff === 1 ? "Yesterday" : d.toLocaleDateString("en-NG", { day: "numeric", month: "long" });
    (groups[label] ??= []).push(t);
  });
  return groups;
}

function Transactions() {
  const [active, setActive] = useState<(typeof tabs)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const loadTransactions = useServerFn(getMyTransactions);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const txs = await loadTransactions();
        if (mounted) setTransactions(txs);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadTransactions]);

  const filtered = transactions.filter((t) => {
    if (active !== "all" && t.category !== active) return false;
    if (q && !`${t.service} ${t.description} ${t.reference}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const groups = groupByDate(filtered);

  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      <h1 className="text-2xl font-extrabold text-foreground">Transactions</h1>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by service, reference…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 rounded-2xl border-transparent bg-card pl-11 shadow-card"
        />
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={
              active === t.key
                ? "shrink-0 rounded-full bg-gradient-brand px-4 py-2 text-xs font-bold text-white shadow-brand"
                : "shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        {loading ? (
          <div className="space-y-3 rounded-3xl bg-card p-4 shadow-card">
            <div className="h-12 w-full rounded skeleton" />
            <div className="h-12 w-full rounded skeleton" />
            <div className="h-12 w-full rounded skeleton" />
          </div>
        ) : Object.keys(groups).length === 0 ? (
          <div className="rounded-3xl bg-card p-10 text-center shadow-card">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
              <Search size={22} />
            </div>
            <p className="mt-4 text-sm font-bold text-foreground">No transactions found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different filter or search term.</p>
          </div>
        ) : (
          Object.entries(groups).map(([label, txs]) => (
            <div key={label}>
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
              <div className="divide-y divide-border rounded-3xl bg-card px-4 shadow-card">
                {txs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-brand-red">
                      <ServiceIcon type={t.category} size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{t.service}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })} • {t.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatNaira(t.amount)}</p>
                      <StatusBadge status={t.status} className="mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-3xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.service}</DialogTitle>
              </DialogHeader>
              <div className="mt-2 space-y-3">
                <Row label="Amount" value={<span className="font-bold">{formatNaira(selected.amount)}</span>} />
                <Row label="Status" value={<StatusBadge status={selected.status} />} />
                <Row label="Description" value={selected.description} />
                <Row label="Reference" value={<span className="font-mono text-xs">{selected.reference}</span>} />
                <Row label="Date" value={new Date(selected.date).toLocaleString("en-NG")} />
              </div>
              <div className="mt-4 flex gap-2">
                {selected.status === "pending" && (
                  <Button
                    className="h-11 flex-1 rounded-xl bg-gradient-brand text-white"
                    onClick={() => toast.success("Status requeried — still pending")}
                  >
                    Requery status
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-11 flex-1 rounded-xl"
                  onClick={() => toast("Support notified", { description: "We'll reach out shortly." })}
                >
                  Report issue
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
