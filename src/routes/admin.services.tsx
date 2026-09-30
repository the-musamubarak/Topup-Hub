import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { listPricing, upsertPricing, deletePricing } from "@/lib/pricing.functions";
import { formatNaira } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/services")({
  component: AdminPricing,
});

type Row = {
  id?: string;
  service_type: string;
  provider_id: string;
  plan_code: string | null;
  label: string | null;
  base_cost_kobo: number;
  markup_kobo: number;
  markup_percent: number;
  is_active: boolean;
};

const SERVICE_TYPES = ["airtime", "data", "cable", "electricity", "epin", "exam"];

function AdminPricing() {
  const list = useServerFn(listPricing);
  const save = useServerFn(upsertPricing);
  const del = useServerFn(deletePricing);
  const [rows, setRows] = useState<Row[]>([]);
  const [newRow, setNewRow] = useState<Row>({
    service_type: "airtime", provider_id: "mtn", plan_code: null, label: null,
    base_cost_kobo: 0, markup_kobo: 0, markup_percent: 0, is_active: true,
  });

  const reload = () => list().then((r) => setRows(r as Row[]));
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const priceKobo = (r: Row) =>
    r.base_cost_kobo + r.markup_kobo + Math.round(r.base_cost_kobo * (r.markup_percent / 100));

  const doSave = async (r: Row) => {
    try {
      await save({ data: r });
      toast.success("Saved");
      reload();
    } catch (e) { toast.error(String((e as Error).message)); }
  };
  const doDel = async (id: string) => {
    try { await del({ data: { id } }); toast.success("Deleted"); reload(); }
    catch (e) { toast.error(String((e as Error).message)); }
  };
  const doAdd = async () => {
    try {
      await save({ data: newRow });
      toast.success("Added");
      setNewRow({ ...newRow, plan_code: null, label: null, base_cost_kobo: 0, markup_kobo: 0, markup_percent: 0 });
      reload();
    } catch (e) { toast.error(String((e as Error).message)); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Services & pricing</h1>
        <p className="text-sm text-muted-foreground">Set your markup on top of the ClubKonnect price for each service/provider/plan.</p>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <p className="text-sm font-bold">Add / update a plan</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          <select className="h-10 rounded-xl border border-border bg-background px-2 text-sm" value={newRow.service_type} onChange={(e) => setNewRow({ ...newRow, service_type: e.target.value })}>
            {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Input placeholder="provider id (mtn)" className="h-10 rounded-xl" value={newRow.provider_id} onChange={(e) => setNewRow({ ...newRow, provider_id: e.target.value })} />
          <Input placeholder="plan code (opt.)" className="h-10 rounded-xl" value={newRow.plan_code ?? ""} onChange={(e) => setNewRow({ ...newRow, plan_code: e.target.value || null })} />
          <Input placeholder="label (opt.)" className="h-10 rounded-xl" value={newRow.label ?? ""} onChange={(e) => setNewRow({ ...newRow, label: e.target.value || null })} />
          <Input placeholder="base ₦" type="number" className="h-10 rounded-xl" value={newRow.base_cost_kobo / 100 || ""} onChange={(e) => setNewRow({ ...newRow, base_cost_kobo: Math.round(Number(e.target.value) * 100) })} />
          <Input placeholder="markup ₦" type="number" className="h-10 rounded-xl" value={newRow.markup_kobo / 100 || ""} onChange={(e) => setNewRow({ ...newRow, markup_kobo: Math.round(Number(e.target.value) * 100) })} />
          <Input placeholder="markup %" type="number" step="0.1" className="h-10 rounded-xl" value={newRow.markup_percent || ""} onChange={(e) => setNewRow({ ...newRow, markup_percent: Number(e.target.value) || 0 })} />
        </div>
        <div className="mt-3 flex justify-end">
          <Button className="h-10 rounded-xl bg-gradient-brand text-white" onClick={doAdd}><Plus size={14} className="mr-1" /> Add plan</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_0.7fr_auto] gap-2 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground lg:grid">
          <div>Service</div><div>Provider</div><div>Plan</div><div>Base</div><div>Markup ₦</div><div>Markup %</div><div>Sell price</div><div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-border">
          {rows.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No pricing rows yet. Add one above.</div>}
          {rows.map((r, i) => (
            <div key={r.id} className="grid grid-cols-1 gap-2 px-4 py-3 text-sm lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_0.7fr_auto] lg:items-center">
              <div className="font-semibold">{r.service_type}</div>
              <div>{r.provider_id}</div>
              <div className="text-xs">{r.plan_code || "—"}{r.label ? ` (${r.label})` : ""}</div>
              <Input type="number" className="h-9 rounded-xl" value={r.base_cost_kobo / 100} onChange={(e) => setRows(rs => rs.map((x, idx) => idx === i ? { ...x, base_cost_kobo: Math.round(Number(e.target.value) * 100) } : x))} />
              <Input type="number" className="h-9 rounded-xl" value={r.markup_kobo / 100} onChange={(e) => setRows(rs => rs.map((x, idx) => idx === i ? { ...x, markup_kobo: Math.round(Number(e.target.value) * 100) } : x))} />
              <Input type="number" step="0.1" className="h-9 rounded-xl" value={r.markup_percent} onChange={(e) => setRows(rs => rs.map((x, idx) => idx === i ? { ...x, markup_percent: Number(e.target.value) || 0 } : x))} />
              <div className="font-bold text-brand-red">{formatNaira(priceKobo(r) / 100)}</div>
              <div className="flex items-center justify-end gap-2">
                <Switch checked={r.is_active} onCheckedChange={(v) => setRows(rs => rs.map((x, idx) => idx === i ? { ...x, is_active: v } : x))} />
                <Button size="sm" variant="outline" className="h-8 rounded-xl" onClick={() => doSave(r)}><Save size={13} /></Button>
                <Button size="sm" variant="outline" className="h-8 rounded-xl text-destructive" onClick={() => r.id && doDel(r.id)}><Trash2 size={13} /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
