import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, RefreshCw, Wallet, Save } from "lucide-react";
import { getClubkonnectBalance, getLatestBalanceSnapshot, setLowBalanceThreshold } from "@/lib/clubkonnect.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatNaira } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const fetchLatest = useServerFn(getLatestBalanceSnapshot);
  const refresh = useServerFn(getClubkonnectBalance);
  const saveThreshold = useServerFn(setLowBalanceThreshold);
  const [balanceKobo, setBalanceKobo] = useState<number | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(5000);
  const [thresholdKobo, setThresholdKobo] = useState<number>(500000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLatest().then((r) => {
      setBalanceKobo(r.balance_kobo);
      setFetchedAt(r.fetched_at);
      setThresholdKobo(r.low_balance_threshold_kobo);
      setThreshold(r.low_balance_threshold_kobo / 100);
    }).catch(() => { /* first load */ });
  }, [fetchLatest]);

  const doRefresh = async () => {
    setLoading(true);
    try {
      const r = await refresh({});
      setBalanceKobo(r.balance_kobo);
      setFetchedAt(r.fetched_at);
      setThresholdKobo(r.low_balance_threshold_kobo);
      toast.success("ClubKonnect balance updated");
    } catch (e) {
      toast.error("Could not fetch balance", { description: String((e as Error).message) });
    } finally { setLoading(false); }
  };

  const doSaveThreshold = async () => {
    try {
      await saveThreshold({ data: { threshold_kobo: Math.round(threshold * 100) } });
      setThresholdKobo(Math.round(threshold * 100));
      toast.success("Low-balance threshold saved");
    } catch (e) { toast.error(String((e as Error).message)); }
  };

  const isLow = balanceKobo !== null && balanceKobo < thresholdKobo;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Overview</h1>
        <p className="text-sm text-muted-foreground">Live ClubKonnect balance and platform pulse.</p>
      </div>

      {isLow && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle size={18} className="mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-bold">Low ClubKonnect balance</p>
            <p className="text-xs">Balance {formatNaira((balanceKobo ?? 0) / 100)} is below your threshold of {formatNaira(thresholdKobo / 100)}. Top up ClubKonnect to keep sales flowing.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white"><Wallet size={16} /></div>
              <p className="text-sm font-bold">ClubKonnect wallet</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={doRefresh} disabled={loading}>
              <RefreshCw size={13} className={loading ? "mr-1 animate-spin" : "mr-1"} /> Refresh
            </Button>
          </div>
          <p className="mt-3 text-3xl font-extrabold">{balanceKobo === null ? "—" : formatNaira(balanceKobo / 100)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {fetchedAt ? `Updated ${new Date(fetchedAt).toLocaleString("en-NG")}` : "Not fetched yet — click Refresh."}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-card">
          <p className="text-sm font-bold">Low-balance alert threshold</p>
          <p className="mt-1 text-xs text-muted-foreground">Show a warning across admin when ClubKonnect drops below this.</p>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value) || 0)}
                className="h-11 rounded-xl pl-7"
              />
            </div>
            <Button className="h-11 rounded-xl bg-gradient-brand text-white" onClick={doSaveThreshold}>
              <Save size={14} className="mr-1" /> Save
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-card">
        <p className="text-sm font-bold">Quick tips</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Set per-service markups on <b>Services & pricing</b>.</li>
          <li>• Refund a transaction from <b>Transactions</b> — it auto-credits the wallet and logs to the audit trail.</li>
          <li>• Send announcements from <b>Broadcasts</b> — users see a bell badge on Home.</li>
          <li>• Export revenue/cost/profit CSV from <b>Analytics</b>.</li>
        </ul>
      </div>
    </div>
  );
}
