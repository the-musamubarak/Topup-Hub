import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLog } from "@/lib/audit.functions";

export const Route = createFileRoute("/admin/audit")({
  component: AuditLogPage,
});

type Row = {
  id: string; actor_id: string; action: string; target_type: string | null; target_id: string | null;
  before_data: unknown; after_data: unknown; notes: string | null; created_at: string;
};

function AuditLogPage() {
  const list = useServerFn(listAuditLog);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => { list().then((r) => setRows(r as Row[])); }, [list]);

  const filtered = rows.filter((r) =>
    q === "" || [r.action, r.target_type ?? "", r.target_id ?? "", r.notes ?? "", r.actor_id].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Audit log</h1>
        <p className="text-sm text-muted-foreground">Every admin action, in chronological order.</p>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action, target, actor…" className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-card" />

      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        <div className="divide-y divide-border">
          {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No audit entries.</p>}
          {filtered.map((r) => {
            const detailText: string = String(JSON.stringify({ before: r.before_data, after: r.after_data, notes: r.notes }, null, 2) ?? "");
            return (
              <div key={r.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{r.action}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString("en-NG")}</p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  actor <span className="font-mono">{r.actor_id.slice(0, 8)}</span>
                  {r.target_type && <> · target {r.target_type} <span className="font-mono">{(r.target_id ?? "").slice(0, 8)}</span></>}
                </p>
                {Boolean(r.before_data || r.after_data) && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-brand">Details</summary>
                    <textarea readOnly value={detailText} className="mt-2 h-40 w-full rounded-xl bg-muted p-2 font-mono text-[10px]" />
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
