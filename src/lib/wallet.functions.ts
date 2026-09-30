import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("wallets")
      .select("balance_kobo")
      .eq("user_id", context.userId)
      .maybeSingle();
    return { balance_kobo: data?.balance_kobo ?? 0 };
  });

export const getMyLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("wallet_ledger")
      .select("id, type, amount_kobo, balance_after_kobo, notes, reference, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  });

export const getMyTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("transactions")
      .select("id, service_type, provider_id, plan_code, recipient, amount_kobo, status, created_at, clubkonnect_ref, notes")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      service:
        row.service_type === "airtime"
          ? `Airtime • ${row.recipient ?? row.provider_id ?? ""}`
          : row.service_type === "data"
          ? `Data • ${row.recipient ?? row.provider_id ?? ""}`
          : row.service_type === "cable"
          ? `Cable • ${row.recipient ?? row.provider_id ?? ""}`
          : row.service_type === "electricity"
          ? `Electricity • ${row.recipient ?? row.provider_id ?? ""}`
          : row.service_type === "exam"
          ? `Exam • ${row.recipient ?? row.provider_id ?? ""}`
          : row.service_type === "epin"
          ? `Recharge Pin • ${row.recipient ?? row.provider_id ?? ""}`
          : row.service_type ?? "Transaction",
      category: row.service_type,
      description: row.recipient ?? row.notes ?? row.provider_id ?? row.plan_code ?? "",
      amount: Number(row.amount_kobo ?? 0) / 100,
      status: row.status as "success" | "pending" | "failed" | "refunded",
      date: row.created_at,
      reference: row.clubkonnect_ref ?? row.id,
    }));
  });

const adjustSchema = z.object({
  target_user_id: z.string().uuid(),
  amount_kobo: z.number().int().positive().max(10_000_000_00),
  reason: z.string().trim().min(3).max(500),
  direction: z.enum(["credit", "debit"]),
});

export const adminAdjustWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => adjustSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("balance_kobo")
      .eq("user_id", data.target_user_id)
      .maybeSingle();
    const before = wallet?.balance_kobo ?? 0;
    const delta = data.direction === "credit" ? data.amount_kobo : -data.amount_kobo;
    const after = before + delta;
    if (after < 0) throw new Error("Insufficient balance for debit");

    await supabaseAdmin.from("wallets").upsert({ user_id: data.target_user_id, balance_kobo: after });
    await supabaseAdmin.from("wallet_ledger").insert({
      user_id: data.target_user_id,
      type: data.direction === "credit" ? "admin_credit" : "admin_debit",
      amount_kobo: delta,
      balance_after_kobo: after,
      notes: data.reason,
      actor_id: context.userId,
    });
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: data.direction === "credit" ? "wallet_credit" : "wallet_debit",
      target_type: "user",
      target_id: data.target_user_id,
      before_data: { balance_kobo: before },
      after_data: { balance_kobo: after, delta, reason: data.reason },
    });
    return { balance_kobo: after };
  });

const refundSchema = z.object({
  transaction_id: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
});

export const adminRefundTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => refundSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tx } = await supabaseAdmin
      .from("transactions")
      .select("id, user_id, amount_kobo, status")
      .eq("id", data.transaction_id)
      .maybeSingle();
    if (!tx) throw new Error("Transaction not found");
    if (tx.status === "refunded") throw new Error("Already refunded");

    const { data: wallet } = await supabaseAdmin.from("wallets").select("balance_kobo").eq("user_id", tx.user_id).maybeSingle();
    const before = wallet?.balance_kobo ?? 0;
    const after = before + tx.amount_kobo;

    await supabaseAdmin.from("wallets").upsert({ user_id: tx.user_id, balance_kobo: after });
    await supabaseAdmin.from("wallet_ledger").insert({
      user_id: tx.user_id,
      type: "refund",
      amount_kobo: tx.amount_kobo,
      balance_after_kobo: after,
      notes: data.reason,
      reference: tx.id,
      actor_id: context.userId,
    });
    await supabaseAdmin.from("transactions").update({ status: "refunded", notes: data.reason }).eq("id", tx.id);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "refund_transaction",
      target_type: "transaction",
      target_id: tx.id,
      before_data: { status: tx.status, wallet_balance_kobo: before },
      after_data: { status: "refunded", wallet_balance_kobo: after, reason: data.reason },
    });
    return { ok: true };
  });
