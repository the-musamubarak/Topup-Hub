import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("admin_audit_log")
      .select("id, actor_id, action, target_type, target_id, before_data, after_data, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });
