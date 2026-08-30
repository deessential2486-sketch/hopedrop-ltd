-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  balance NUMERIC NOT NULL DEFAULT 200000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create BPC submissions table
CREATE TYPE public.bpc_status AS ENUM ('pending', 'approved', 'declined');

CREATE TABLE public.bpc_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.bpc_status NOT NULL DEFAULT 'pending',
  proof_url TEXT NOT NULL,
  admin_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.bpc_submissions TO authenticated;
GRANT ALL ON public.bpc_submissions TO service_role;
ALTER TABLE public.bpc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions" ON public.bpc_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON public.bpc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bpc_submissions_updated_at BEFORE UPDATE ON public.bpc_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can upload payment proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view payment proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');

-- KYC
CREATE TYPE public.kyc_status AS ENUM ('not_verified','pending','verified','failed');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_tier smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nin_verification_status public.kyc_status NOT NULL DEFAULT 'not_verified',
  ADD COLUMN IF NOT EXISTS bvn_verification_status public.kyc_status NOT NULL DEFAULT 'not_verified',
  ADD COLUMN IF NOT EXISTS nin_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS bvn_verified_at timestamptz;

CREATE TABLE public.kyc_verification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('nin','bvn')),
  provider text NOT NULL,
  succeeded boolean NOT NULL DEFAULT false,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX kyc_attempts_user_time_idx ON public.kyc_verification_attempts (user_id, created_at DESC);

GRANT SELECT ON public.kyc_verification_attempts TO authenticated;
GRANT ALL ON public.kyc_verification_attempts TO service_role;
ALTER TABLE public.kyc_verification_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own kyc attempts" ON public.kyc_verification_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 1. USER ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2. REFERRAL ID ON PROFILES
ALTER TABLE public.profiles ADD COLUMN referral_id text;

CREATE OR REPLACE FUNCTION public.generate_referral_id()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
BEGIN
  LOOP
    candidate := 'REF-';
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_id = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

UPDATE public.profiles SET referral_id = public.generate_referral_id() WHERE referral_id IS NULL;

ALTER TABLE public.profiles ALTER COLUMN referral_id SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_referral_id_key UNIQUE (referral_id);
CREATE INDEX idx_profiles_referral_id ON public.profiles (referral_id);

CREATE OR REPLACE FUNCTION public.prevent_referral_id_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.referral_id IS DISTINCT FROM OLD.referral_id THEN
    RAISE EXCEPTION 'referral_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_referral_id_immutable BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_referral_id_change();

-- 3. WALLET TRANSACTIONS
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric NOT NULL,
  description text NOT NULL DEFAULT '',
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_wallet_tx_user ON public.wallet_transactions (user_id, created_at DESC);
CREATE UNIQUE INDEX idx_wallet_tx_reference ON public.wallet_transactions (reference) WHERE reference IS NOT NULL;

-- 4. NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'general',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_notifications_user ON public.notifications (user_id, created_at DESC);

-- 5. REFERRALS
CREATE TYPE public.referral_status AS ENUM ('pending', 'successful', 'rejected');
CREATE TYPE public.referral_fraud_status AS ENUM ('clean', 'under_review', 'fraud');

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id text NOT NULL,
  status public.referral_status NOT NULL DEFAULT 'pending',
  fraud_status public.referral_fraud_status NOT NULL DEFAULT 'clean',
  bonus_amount numeric NOT NULL DEFAULT 500,
  bonus_transaction_id uuid REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  successful_at timestamptz,
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referrals_no_self_referral CHECK (referrer_user_id <> referred_user_id)
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
FOR SELECT TO authenticated
USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update referrals" ON public.referrals
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_referrals_referrer ON public.referrals (referrer_user_id, created_at DESC);
CREATE INDEX idx_referrals_status ON public.referrals (status);
CREATE UNIQUE INDEX idx_referrals_bonus_tx ON public.referrals (bonus_transaction_id) WHERE bonus_transaction_id IS NOT NULL;

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.prevent_referral_relationship_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.referrer_user_id IS DISTINCT FROM OLD.referrer_user_id
     OR NEW.referred_user_id IS DISTINCT FROM OLD.referred_user_id
     OR NEW.referral_id IS DISTINCT FROM OLD.referral_id THEN
    RAISE EXCEPTION 'referral relationship cannot be changed';
  END IF;
  IF OLD.bonus_transaction_id IS NOT NULL AND NEW.bonus_transaction_id IS DISTINCT FROM OLD.bonus_transaction_id THEN
    RAISE EXCEPTION 'bonus transaction cannot be changed once paid';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER referrals_relationship_immutable BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.prevent_referral_relationship_change();

-- 6. SIGNUP: assign referral id + create pending referral from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref_code text;
  referrer uuid;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, referral_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    public.generate_referral_id()
  );

  ref_code := upper(nullif(trim(COALESCE(NEW.raw_user_meta_data->>'referred_by', '')), ''));
  IF ref_code IS NOT NULL THEN
    SELECT user_id INTO referrer FROM public.profiles WHERE referral_id = ref_code;
    IF referrer IS NOT NULL AND referrer <> NEW.id THEN
      INSERT INTO public.referrals (referrer_user_id, referred_user_id, referral_id)
      VALUES (referrer, NEW.id, ref_code)
      ON CONFLICT (referred_user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM public, anon, authenticated;

-- 7. ATOMIC REWARD PROCESSING
CREATE OR REPLACE FUNCTION public.process_referral_reward(_referred_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.referrals%ROWTYPE;
  tx_id uuid;
BEGIN
  SELECT * INTO r FROM public.referrals
  WHERE referred_user_id = _referred_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN; END IF;
  IF r.status <> 'pending' OR r.bonus_transaction_id IS NOT NULL THEN RETURN; END IF;
  IF r.fraud_status <> 'clean' THEN RETURN; END IF;
  IF r.referrer_user_id = r.referred_user_id THEN RETURN; END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, description, reference)
  VALUES (r.referrer_user_id, 'referral_bonus', r.bonus_amount,
          'Referral Bonus', 'referral:' || r.id::text)
  RETURNING id INTO tx_id;

  UPDATE public.profiles
  SET balance = balance + r.bonus_amount
  WHERE user_id = r.referrer_user_id;

  UPDATE public.referrals
  SET status = 'successful', successful_at = now(), bonus_transaction_id = tx_id
  WHERE id = r.id;

  INSERT INTO public.notifications (user_id, title, body, kind)
  VALUES (r.referrer_user_id, 'Referral Bonus Credited',
          'Congratulations! You earned ₦500 from your referral.', 'referral');
END;
$$;

-- 8. ELIGIBILITY TRIGGERS
CREATE OR REPLACE FUNCTION public.referral_check_bpc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
    PERFORM public.process_referral_reward(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER bpc_referral_reward AFTER INSERT OR UPDATE ON public.bpc_submissions
FOR EACH ROW EXECUTE FUNCTION public.referral_check_bpc();

CREATE OR REPLACE FUNCTION public.referral_check_kyc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.nin_verification_status = 'verified' AND OLD.nin_verification_status IS DISTINCT FROM 'verified' THEN
    PERFORM public.process_referral_reward(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_referral_reward AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.referral_check_kyc();

-- 9. Public lookup of a referral code validity (no PII)
CREATE OR REPLACE FUNCTION public.referral_code_exists(_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_id = upper(trim(_code)))
$$;