// Paystack calls this URL automatically whenever a payment succeeds
// (both one-off checkout payments AND dedicated virtual account transfers,
// once we set that up). This is the source of truth for crediting wallets —
// verifyWalletFunding in funding.functions.ts is just a backup in case this
// is ever delayed.
import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";

export const Route = createFileRoute("/api/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-paystack-signature");

        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) {
          console.error("PAYSTACK_SECRET_KEY not configured");
          return new Response("Server misconfigured", { status: 500 });
        }

        const expectedSignature = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
        if (signature !== expectedSignature) {
          console.error("Invalid Paystack webhook signature");
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(rawBody);

        if (event.event === "charge.success") {
          const data = event.data;
          const reference: string = data.reference;
          const amountKobo: number = data.amount;
          const userId: string | undefined = data.metadata?.user_id;

          if (!userId) {
            console.error("Webhook charge.success missing user_id in metadata", reference);
            return new Response("OK", { status: 200 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: existing } = await supabaseAdmin
            .from("wallet_ledger")
            .select("id")
            .eq("reference", reference)
            .maybeSingle();
          if (existing) return new Response("OK", { status: 200 });

          const { data: wallet } = await supabaseAdmin
            .from("wallets")
            .select("balance_kobo")
            .eq("user_id", userId)
            .maybeSingle();
          const before = wallet?.balance_kobo ?? 0;
          const after = before + amountKobo;

          await supabaseAdmin.from("wallets").upsert({ user_id: userId, balance_kobo: after });
          await supabaseAdmin.from("wallet_ledger").insert({
            user_id: userId,
            type: "funding",
            amount_kobo: amountKobo,
            balance_after_kobo: after,
            reference,
            notes: "Wallet funded via Paystack (webhook)",
          });
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});
