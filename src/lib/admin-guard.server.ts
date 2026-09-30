// Server-only helper: throws if the caller is not an admin.
import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertAdmin(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) {
    console.error("Admin role RPC failed", { userId, error });
  }

  if (error || !data) {
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("Admin role fallback check failed", { userId, roleError });
      throw new Error(`Forbidden: admin only (role check failed: ${roleError.message})`);
    }

    if (roleData?.role !== "admin") {
      console.error("Admin access denied", { userId, roleData });
      throw new Error("Forbidden: admin only");
    }

    return;
  }
}
