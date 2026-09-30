import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PAYSTACK_BASE = "https://api.paystack.co";

function paystackHeaders() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

const initSchema = z.object({
  amount_naira: z.number().positive().max(1_000_000),
});

export const initializeWalletFunding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => initSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: userResult } = await context.supabase.auth.getUser();
    const email = userResult.user?.email;
    if (!email) throw new Error("Could not resolve user email");

    const reference = `TUH-FUND-${Date.now()}-${context.userId.slice(0, 8)}`;
    const amountKobo = Math.round(data.amount_naira * 100);

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: paystackHeaders(),
      body: JSON.stringify({
        email,
        amount: amountKobo,
        reference,
        metadata: { user_id: context.userId, purpose: "wallet_funding" },
      }),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.message ?? "Failed to start payment");

    return {
      authorization_url: json.data.authorization_url as string,
      reference: json.data.reference as string,
    };
  });

const verifySchema = z.object({ reference: z.string() });

export const verifyWalletFunding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => verifySchema.parse(input))
  .handler(async ({ data, context }) => {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${data.reference}`, {
      headers: paystackHeaders(),
    });
    const json = await res.json();
    if (!json.status || json.data.status !== "success") {
      return { credited: false, status: json.data?.status ?? "unknown" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("wallet_ledger")
      .select("id")
      .eq("reference", data.reference)
      .maybeSingle();
    if (existing) return { credited: true, status: "already_credited" };

    if (json.data.metadata?.user_id !== context.userId) {
      throw new Error("Reference does not belong to this user");
    }

    const amountKobo = json.data.amount as number;
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("balance_kobo")
      .eq("user_id", context.userId)
      .maybeSingle();
    const before = wallet?.balance_kobo ?? 0;
    const after = before + amountKobo;

    await supabaseAdmin.from("wallets").upsert({ user_id: context.userId, balance_kobo: after });
    await supabaseAdmin.from("wallet_ledger").insert({
      user_id: context.userId,
      type: "funding",
      amount_kobo: amountKobo,
      balance_after_kobo: after,
      reference: data.reference,
      notes: "Wallet funded via Paystack (card/bank/USSD)",
    });

    return { credited: true, status: "success", new_balance_kobo: after };
  });
