
-- Add audience_tags and urgency to knowledge_sources
ALTER TABLE public.knowledge_sources ADD COLUMN IF NOT EXISTS audience_tags text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.knowledge_sources ADD COLUMN IF NOT EXISTS urgency integer NOT NULL DEFAULT 0;

-- Create personalization_events table for analytics
CREATE TABLE public.personalization_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.personalization_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events"
  ON public.personalization_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own events"
  ON public.personalization_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
