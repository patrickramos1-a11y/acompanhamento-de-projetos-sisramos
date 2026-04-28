CREATE TABLE public.responsibles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.responsibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access" ON public.responsibles FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_responsibles_updated_at
BEFORE UPDATE ON public.responsibles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.project_records
  ADD COLUMN responsible_id uuid NULL REFERENCES public.responsibles(id) ON DELETE SET NULL;

CREATE INDEX idx_project_records_responsible_id ON public.project_records(responsible_id);
