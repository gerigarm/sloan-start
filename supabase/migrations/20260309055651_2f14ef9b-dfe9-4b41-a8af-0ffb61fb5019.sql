
CREATE TABLE public.wellbeing_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  energy_level INTEGER NOT NULL CHECK (energy_level >= 0 AND energy_level <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wellbeing_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own checkins"
  ON public.wellbeing_checkins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own checkins"
  ON public.wellbeing_checkins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
