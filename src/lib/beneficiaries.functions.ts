import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listBeneficiaries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("beneficiaries")
      .select("id, nickname, service_type, provider_id, identifier, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

const upsertSchema = z.object({
  nickname: z.string().trim().min(1).max(50),
  service_type: z.string().min(1).max(30),
  provider_id: z.string().min(1).max(30),
  identifier: z.string().trim().min(1).max(60),
});

export const saveBeneficiary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("beneficiaries")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "user_id,service_type,provider_id,identifier" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBeneficiary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase.from("beneficiaries").delete().eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });
