ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS face_verification_status public.kyc_status NOT NULL DEFAULT 'not_verified',
  ADD COLUMN IF NOT EXISTS face_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS face_selfie_path text;

DROP POLICY IF EXISTS "Users can view own kyc selfies" ON storage.objects;
CREATE POLICY "Users can view own kyc selfies"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kyc-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
