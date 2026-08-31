REVOKE ALL ON FUNCTION public.generate_referral_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_referral_reward(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.referral_check_bpc() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.referral_check_kyc() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.referral_code_exists(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.referral_code_exists(text) TO authenticated, service_role;
