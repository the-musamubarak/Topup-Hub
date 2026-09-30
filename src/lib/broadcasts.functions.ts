import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listMyBroadcasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("broadcast_reads")
      .select("id, read_at, broadcast:broadcasts(id, title, body, cta_label, cta_url, created_at)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const markBroadcastRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { read_id: string }) => z.object({ read_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("broadcast_reads")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.read_id)
      .eq("user_id", context.userId);
    return { ok: true };
  });

const sendSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(3).max(2000),
  cta_label: z.string().trim().max(30).optional().nullable(),
  cta_url: z.string().trim().max(500).optional().nullable(),
  audience: z.enum(["all", "active_30d", "never_transacted", "admins_only", "single_user"]),
  audience_user_id: z.string().uuid().optional().nullable(),
});

export const sendBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: broadcast, error } = await supabaseAdmin
      .from("broadcasts")
      .insert({
        title: data.title,
        body: data.body,
        cta_label: data.cta_label ?? null,
        cta_url: data.cta_url ?? null,
        audience: data.audience,
        audience_user_id: data.audience_user_id ?? null,
        created_by: context.userId,
      })
      .select()
      .maybeSingle();
    if (error || !broadcast) throw new Error(error?.message ?? "Failed to create broadcast");

    // Resolve audience
    let userIds: string[] = [];
    if (data.audience === "single_user" && data.audience_user_id) {
      userIds = [data.audience_user_id];
    } else if (data.audience === "admins_only") {
      const { data: rows } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
      userIds = (rows ?? []).map((r) => r.user_id);
    } else if (data.audience === "active_30d") {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data: rows } = await supabaseAdmin.from("transactions").select("user_id").gte("created_at", since);
      userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    } else if (data.audience === "never_transacted") {
      const { data: allUsers } = await supabaseAdmin.from("profiles").select("id");
      const { data: txUsers } = await supabaseAdmin.from("transactions").select("user_id");
      const txSet = new Set((txUsers ?? []).map((r) => r.user_id));
      userIds = (allUsers ?? []).map((r) => r.id).filter((id) => !txSet.has(id));
    } else {
      const { data: rows } = await supabaseAdmin.from("profiles").select("id");
      userIds = (rows ?? []).map((r) => r.id);
    }

    if (userIds.length > 0) {
      const rows = userIds.map((uid) => ({ broadcast_id: broadcast.id, user_id: uid }));
      // batch insert
      await supabaseAdmin.from("broadcast_reads").insert(rows);
    }

    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "broadcast_sent",
      target_type: "broadcast",
      target_id: broadcast.id,
      after_data: { audience: data.audience, recipients: userIds.length, title: data.title },
    });
    return { ok: true, recipients: userIds.length };
  });

export const listBroadcastsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("broadcasts")
      .select("id, title, body, audience, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });
