import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyPoints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("loyalty_points")
      .select("balance, lifetime_earned")
      .eq("user_id", context.userId)
      .maybeSingle();
    const { data: settings } = await context.supabase
      .from("app_settings")
      .select("points_per_naira, point_value_kobo, min_redeem_points")
      .eq("id", true)
      .maybeSingle();
    return {
      balance: data?.balance ?? 0,
      lifetime_earned: data?.lifetime_earned ?? 0,
      points_per_naira: Number(settings?.points_per_naira ?? 0.01),
      point_value_kobo: Number(settings?.point_value_kobo ?? 100),
      min_redeem_points: Number(settings?.min_redeem_points ?? 100),
    };
  });

export const getMyPointsLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("loyalty_ledger")
      .select("id, type, points, balance_after, notes, reference, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  });

const redeemSchema = z.object({
  points: z.number().int().positive(),
  network_id: z.string(),
  phone: z.string().trim().min(10).max(15),
});

export const redeemPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => redeemSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("point_value_kobo, min_redeem_points")
      .eq("id", true)
      .maybeSingle();
    const minPts = Number(settings?.min_redeem_points ?? 100);
    const pointValueKobo = Number(settings?.point_value_kobo ?? 100);
    if (data.points < minPts) throw new Error(`Minimum redemption is ${minPts} points`);

    const { data: lp } = await supabaseAdmin
      .from("loyalty_points")
      .select("balance")
      .eq("user_id", context.userId)
      .maybeSingle();
    const bal = lp?.balance ?? 0;
    if (bal < data.points) throw new Error("Not enough points");

    const airtimeKobo = Math.round(data.points * pointValueKobo);
    const airtimeNaira = airtimeKobo / 100;
    const newBal = bal - data.points;

    await supabaseAdmin.from("loyalty_points").update({ balance: newBal }).eq("user_id", context.userId);
    await supabaseAdmin.from("loyalty_ledger").insert({
      user_id: context.userId,
      type: "redeem",
      points: -data.points,
      balance_after: newBal,
      notes: `Redeemed for ₦${airtimeNaira.toFixed(2)} airtime on ${data.network_id.toUpperCase()} ${data.phone}`,
    });

    // Fire ClubKonnect airtime
    const { ckBuyAirtime } = await import("./clubkonnect.server");
    const requestId = "RD" + Date.now();
    let status: "success" | "failed" = "success";
    let raw: unknown = null;
    try {
      const r = await ckBuyAirtime({ networkId: data.network_id, amountNaira: airtimeNaira, phone: data.phone, requestId });
      raw = r.json ?? r.text;
      if (!r.ok) status = "failed";
    } catch (e) {
      status = "failed";
      raw = { error: String(e) };
    }

    await supabaseAdmin.from("transactions").insert({
      user_id: context.userId,
      service_type: "airtime",
      provider_id: data.network_id,
      recipient: data.phone,
      amount_kobo: airtimeKobo,
      cost_kobo: airtimeKobo,
      margin_kobo: 0,
      status,
      clubkonnect_ref: requestId,
      raw_response: raw as never,
      notes: "Loyalty redemption",
    });

    return { ok: status === "success", points_balance: newBal };
  });
