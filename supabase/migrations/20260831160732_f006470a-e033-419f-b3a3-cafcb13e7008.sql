REVOKE EXECUTE ON FUNCTION public.generate_referral_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_referral_reward(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.referral_check_bpc() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.referral_check_kyc() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.referral_code_exists(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
