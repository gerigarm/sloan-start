
CREATE TABLE public.weekly_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stress_level integer NOT NULL CHECK (stress_level BETWEEN 1 AND 5),
  control_level integer NOT NULL CHECK (control_level BETWEEN 1 AND 5),
  confidence_level integer NOT NULL CHECK (confidence_level BETWEEN 1 AND 5),
  stress_causes text[] NOT NULL DEFAULT '{}',
  week_number integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own weekly checkins"
  ON public.weekly_checkins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own weekly checkins"
  ON public.weekly_checkins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
