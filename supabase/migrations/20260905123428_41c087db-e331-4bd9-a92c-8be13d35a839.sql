ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hd_code text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_hd_code_key ON public.profiles (hd_code) WHERE hd_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_hd_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
BEGIN
  LOOP
    candidate := 'HD-';
    FOR i IN 1..8 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE hd_code = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_hd_code() FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION public.issue_hd_code_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.profiles
    SET hd_code = COALESCE(hd_code, public.generate_hd_code())
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.issue_hd_code_on_approval() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS bpc_issue_hd_code ON public.bpc_submissions;
CREATE TRIGGER bpc_issue_hd_code
AFTER INSERT OR UPDATE ON public.bpc_submissions
FOR EACH ROW EXECUTE FUNCTION public.issue_hd_code_on_approval();

UPDATE public.profiles p
SET hd_code = public.generate_hd_code()
WHERE hd_code IS NULL
  AND EXISTS (SELECT 1 FROM public.bpc_submissions b WHERE b.user_id = p.user_id AND b.status = 'approved');