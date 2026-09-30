-- Fix mutable search_path on the updated_at helper
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end $$;

-- Revoke public/authenticated execute on internal SECURITY DEFINER functions.
-- Triggers still run because they execute as the function owner.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.grant_admin_for_designated_email() from public, anon, authenticated;
revoke execute on function public.tg_set_updated_at() from public, anon, authenticated;

-- has_role is used inside RLS policies; keep it callable by signed-in users only.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
