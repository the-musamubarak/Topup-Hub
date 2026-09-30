-- Add columns to store transaction PIN hash and biometric preference
alter table public.profiles
  add column if not exists pin_salt text,
  add column if not exists pin_hash text,
  add column if not exists biometric_enabled boolean default false;

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- Ensure policy allows users to update their own biometric and pin fields (existing policy covers updates by owner)