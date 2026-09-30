REVOKE EXECUTE ON FUNCTION public.handle_new_user_wallet() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_admin_for_designated_email() FROM PUBLIC, anon, authenticated;
