ALTER TABLE public.project_records
  ADD COLUMN IF NOT EXISTS not_applicable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS planned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS planned_for date;