import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getClubkonnectBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { ckWalletBalance } = await import("./clubkonnect.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { balanceNaira, raw } = await ckWalletBalance();
    const balance_kobo = Math.round(balanceNaira * 100);
    await supabaseAdmin.from("clubkonnect_balance_snapshots").insert({ balance_kobo, raw: raw as never });
    const { data: settings } = await supabaseAdmin.from("app_settings").select("low_balance_threshold_kobo").eq("id", true).maybeSingle();
    return {
      balance_kobo,
      fetched_at: new Date().toISOString(),
      low_balance_threshold_kobo: settings?.low_balance_threshold_kobo ?? 500000,
    };
  });

export const getLatestBalanceSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("clubkonnect_balance_snapshots")
      .select("balance_kobo, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: settings } = await context.supabase.from("app_settings").select("low_balance_threshold_kobo").eq("id", true).maybeSingle();
    return {
      balance_kobo: data?.balance_kobo ?? null,
      fetched_at: data?.created_at ?? null,
      low_balance_threshold_kobo: settings?.low_balance_threshold_kobo ?? 500000,
    };
  });

export const setLowBalanceThreshold = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { threshold_kobo: number }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("app_settings").update({ low_balance_threshold_kobo: data.threshold_kobo }).eq("id", true);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "set_low_balance_threshold",
      target_type: "app_settings",
      after_data: { threshold_kobo: data.threshold_kobo },
    });
    return { ok: true };
  });
