import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const checkRegistrationAvailability = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ email: z.string().email().optional(), phone: z.string().optional() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const result: { emailAvailable?: boolean; phoneAvailable?: boolean } = {};

    if (data.email) {
      // Use admin API to check existing user by email
      try {
        // supabase-js admin API
        // @ts-ignore
        const r = await supabaseAdmin.auth.admin.getUserByEmail(data.email);
        result.emailAvailable = !(r?.data?.user);
      } catch (e) {
        // Fallback: query auth.users table
        const { data: rows } = await supabaseAdmin.from("auth.users").select("id").eq("email", data.email).limit(1);
        result.emailAvailable = (rows ?? []).length === 0;
      }
    }

    if (data.phone) {
      const normalized = data.phone.replace(/\D/g, "");
      const { data: rows } = await supabaseAdmin.from("profiles").select("id").eq("phone", normalized).limit(1);
      result.phoneAvailable = (rows ?? []).length === 0;
    }

    return result;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ full_name: z.string().trim().min(0).max(200).optional(), phone: z.string().trim().min(6).max(20).optional(), user_id: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    // This function should be called from the server with auth middleware when updating the current user
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!context?.supabase || !context?.userId) {
      throw new Error("Unauthorized");
    }

    const userId = context.userId;

    if (data.phone) {
      const normalized = data.phone.replace(/\D/g, "");
      const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("phone", normalized).limit(1);
      if ((existing ?? []).length > 0 && existing![0].id !== userId) {
        throw new Error("Phone number already in use");
      }
    }

    const updates: Record<string, any> = {};
    if (data.full_name !== undefined) updates.full_name = data.full_name;
    if (data.phone !== undefined) updates.phone = data.phone.replace(/\D/g, "");

    const { error } = await context.supabase.from("profiles").update(updates).eq("id", userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, phone, email, referral_code, biometric_enabled")
      .eq("id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { profile: data ?? null };
  });

export const setTransactionPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ pin: z.string().regex(/^\d{4,6}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    if (!context?.supabase || !context?.userId) throw new Error("Unauthorized");
    const crypto = await import("crypto");
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(data.pin + salt).digest("hex");
    const { error } = await context.supabase.from("profiles").update({ pin_salt: salt, pin_hash: hash }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setBiometricPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!context?.supabase || !context?.userId) throw new Error("Unauthorized");
    const { error } = await context.supabase.from("profiles").update({ biometric_enabled: data.enabled }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
