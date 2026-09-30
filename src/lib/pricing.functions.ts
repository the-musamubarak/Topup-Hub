import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listPricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("service_pricing")
      .select("id, service_type, provider_id, plan_code, label, base_cost_kobo, markup_kobo, markup_percent, is_active, updated_at")
      .order("service_type")
      .order("provider_id");
    return data ?? [];
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  service_type: z.string().min(1).max(30),
  provider_id: z.string().min(1).max(30),
  plan_code: z.string().max(60).nullable().optional(),
  label: z.string().max(120).nullable().optional(),
  base_cost_kobo: z.number().int().nonnegative(),
  markup_kobo: z.number().int().nonnegative(),
  markup_percent: z.number().nonnegative().max(100),
  is_active: z.boolean(),
});

export const upsertPricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let before: unknown = null;
    if (data.id) {
      const { data: existing } = await supabaseAdmin.from("service_pricing").select("*").eq("id", data.id).maybeSingle();
      before = existing;
    }
    const { data: saved, error } = await supabaseAdmin
      .from("service_pricing")
      .upsert({ ...data, plan_code: data.plan_code ?? null }, { onConflict: "service_type,provider_id,plan_code" })
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "pricing_upsert",
      target_type: "service_pricing",
      target_id: saved?.id,
      before_data: before as never,
      after_data: saved as never,
    });
    return saved;
  });

export const deletePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: before } = await supabaseAdmin.from("service_pricing").select("*").eq("id", data.id).maybeSingle();
    await supabaseAdmin.from("service_pricing").delete().eq("id", data.id);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "pricing_delete",
      target_type: "service_pricing",
      target_id: data.id,
      before_data: before as never,
    });
    return { ok: true };
  });
