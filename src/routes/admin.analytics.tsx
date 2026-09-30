import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, TrendingUp, Download } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRevenueSeries } from "@/lib/analytics.functions";
import { formatNaira } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

type Preset = "day" | "week" | "month" | "custom";

function AdminAnalytics() {
  const [preset, setPreset] = useState<Preset>("week");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [series, setSeries] = useState<Array<{ day: string; revenue: number; cost: number; profit: number; count: number }>>([]);
  const [totals, setTotals] = useState({ revenue: 0, cost: 0, profit: 0, count: 0 });
  const load = useServerFn(getRevenueSeries);

  const range = useMemo(() => {
    const now = new Date();
    let start = new Date();
    if (preset === "day") start.setDate(now.getDate() - 1);
    else if (preset === "week") start.setDate(now.getDate() - 7);
    else if (preset === "month") start.setDate(now.getDate() - 30);
    else if (preset === "custom" && from && to) return { from: new Date(from).toISOString(), to: new Date(to).toISOString() };
    return { from: start.toISOString(), to: now.toISOString() };
  }, [preset, from, to]);

  useEffect(() => {
    load({ data: range }).then((r) => { setSeries(r.series); setTotals(r.totals); }).catch(() => {});
  }, [range, load]);

  const exportCsv = () => {
    const header = ["day", "revenue", "cost", "profit", "count"];
    const lines = [header.join(",")].concat(series.map(s => [s.day, s.revenue.toFixed(2), s.cost.toFixed(2), s.profit.toFixed(2), s.count].join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `analytics-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const marginPct = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Revenue, cost and profit across successful transactions.</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={exportCsv}><Download size={14} className="mr-1" /> CSV</Button>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          {(["day", "week", "month", "custom"] as Preset[]).map((p) => (
            <button key={p} onClick={() => setPreset(p)} className={cn("rounded-xl px-3 py-1.5 text-xs font-bold capitalize", preset === p ? "bg-gradient-brand text-white shadow-brand" : "bg-muted text-muted-foreground")}>
              {p === "day" ? "24h" : p === "week" ? "7 days" : p === "month" ? "30 days" : "Custom"}
            </button>
          ))}
          {preset === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2">
                <Calendar size={14} className="text-muted-foreground" />
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-36 border-0 p-0 text-xs" />
              </div>
              <span className="text-xs text-muted-foreground">to</span>
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2">
                <Calendar size={14} className="text-muted-foreground" />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-36 border-0 p-0 text-xs" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Revenue" value={formatNaira(totals.revenue)} accent="from-brand to-brand-red" />
        <Kpi label="Cost (CK)" value={formatNaira(totals.cost)} accent="from-warning to-brand" />
        <Kpi label="Profit" value={formatNaira(totals.profit)} accent="from-success to-brand" />
        <Kpi label="Margin %" value={marginPct.toFixed(1) + "%"} accent="from-brand-red to-brand" />
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <div className="flex items-center gap-2"><TrendingUp size={16} className="text-brand" /><p className="text-sm font-bold">Revenue · Cost · Profit</p></div>
        <div className="mt-3 h-72">
          <ResponsiveContainer>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={50} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
              <Legend />
              <Bar dataKey="revenue" fill="#FF6600" radius={[6, 6, 0, 0]} />
              <Bar dataKey="cost" fill="#EB001B" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" fill="#00A86B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <p className="text-sm font-bold">Transaction count</p>
        <div className="mt-3 h-56">
          <ResponsiveContainer>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="g-count" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6600" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={30} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
              <Area type="monotone" dataKey="count" stroke="#FF6600" fill="url(#g-count)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={cn("rounded-2xl bg-gradient-to-br p-4 text-white shadow-brand", accent)}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 text-xl font-extrabold">{value}</p>
    </div>
  );
}
