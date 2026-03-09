
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_type text,
  ADD COLUMN IF NOT EXISTS is_international boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS relocation_status text,
  ADD COLUMN IF NOT EXISTS primary_goals text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS concerns text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS program_start_date date;
