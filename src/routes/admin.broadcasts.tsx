import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listBroadcastsAdmin, sendBroadcast } from "@/lib/broadcasts.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/broadcasts")({
  component: AdminBroadcasts,
});

function AdminBroadcasts() {
  const list = useServerFn(listBroadcastsAdmin);
  const send = useServerFn(sendBroadcast);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "active_30d" | "never_transacted" | "admins_only">("all");
  const [rows, setRows] = useState<Array<{ id: string; title: string; body: string; audience: string; created_at: string }>>([]);

  const reload = () => list().then((r) => setRows(r as typeof rows));
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const doSend = async () => {
    if (title.trim().length < 3 || body.trim().length < 3) return toast.error("Title and body required");
    try {
      const r = await send({ data: { title, body, audience, cta_label: null, cta_url: null, audience_user_id: null } });
      toast.success(`Sent to ${r.recipients} user(s)`);
      setTitle(""); setBody(""); reload();
    } catch (e) { toast.error(String((e as Error).message)); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Broadcasts</h1>
        <p className="text-sm text-muted-foreground">Send announcements to segments of users.</p>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-2"><Megaphone size={16} className="text-brand" /><p className="text-sm font-bold">New broadcast</p></div>
        <div className="mt-3 space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-xl" />
          <Textarea placeholder="Message body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="rounded-xl" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Audience:</span>
            {(["all", "active_30d", "never_transacted", "admins_only"] as const).map((a) => (
              <button key={a} onClick={() => setAudience(a)} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${audience === a ? "bg-gradient-brand text-white shadow-brand" : "bg-muted text-muted-foreground"}`}>
                {a.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button className="rounded-xl bg-gradient-brand text-white" onClick={doSend}><Send size={14} className="mr-1" /> Send</Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <p className="text-sm font-bold">Recent broadcasts</p>
        <div className="mt-2 divide-y divide-border">
          {rows.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No broadcasts yet.</p>}
          {rows.map((r) => (
            <div key={r.id} className="py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{r.title}</p>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{r.audience}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{r.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString("en-NG")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
