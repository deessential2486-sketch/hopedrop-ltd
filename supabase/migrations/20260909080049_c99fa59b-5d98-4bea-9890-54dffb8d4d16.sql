ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_size bigint;

ALTER TABLE public.support_messages ALTER COLUMN body SET DEFAULT '';

CREATE POLICY "Chat attachments upload by participants"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM public.support_threads t
    WHERE t.id::text = (storage.foldername(name))[1]
      AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Chat attachments read by participants"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM public.support_threads t
    WHERE t.id::text = (storage.foldername(name))[1]
      AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);