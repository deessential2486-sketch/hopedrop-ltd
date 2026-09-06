CREATE TABLE public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL DEFAULT 'Support chat',
  status text NOT NULL DEFAULT 'open',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'customer',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_threads_user ON public.support_threads(user_id, last_message_at DESC);
CREATE INDEX idx_support_messages_thread ON public.support_messages(thread_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.support_threads TO authenticated;
GRANT ALL ON public.support_threads TO service_role;
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or admin threads" ON public.support_threads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own threads" ON public.support_threads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own or admin threads" ON public.support_threads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "View messages in visible threads" ON public.support_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_threads t
    WHERE t.id = support_messages.thread_id
      AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Send messages in visible threads" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
        AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
    AND (
      (sender_role = 'customer' AND EXISTS (SELECT 1 FROM public.support_threads t WHERE t.id = support_messages.thread_id AND t.user_id = auth.uid()))
      OR (sender_role = 'agent' AND public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE OR REPLACE FUNCTION public.touch_support_thread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_threads
  SET last_message_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER support_messages_touch_thread
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_support_thread();

ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_threads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_threads;