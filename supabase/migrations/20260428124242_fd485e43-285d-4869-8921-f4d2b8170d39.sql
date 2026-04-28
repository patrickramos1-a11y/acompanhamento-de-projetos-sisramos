CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  responsible TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT clients_code_unique UNIQUE (code)
);

CREATE TABLE public.project_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT project_types_abbreviation_unique UNIQUE (abbreviation)
);

CREATE TABLE public.project_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_type_id UUID NOT NULL REFERENCES public.project_types(id) ON DELETE CASCADE,
  year INTEGER,
  requested BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT project_records_client_type_unique UNIQUE (client_id, project_type_id),
  CONSTRAINT project_records_year_reasonable CHECK (year IS NULL OR (year >= 1900 AND year <= 2200))
);

CREATE TABLE public.settings (
  id BOOLEAN NOT NULL DEFAULT true PRIMARY KEY,
  validity_years INTEGER NOT NULL DEFAULT 5,
  warning_years INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = true),
  CONSTRAINT settings_validity_positive CHECK (validity_years > 0 AND validity_years <= 50),
  CONSTRAINT settings_warning_non_negative CHECK (warning_years >= 0 AND warning_years <= 20)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients"
ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create clients"
ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can edit clients"
ON public.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete clients"
ON public.clients FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view project types"
ON public.project_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create project types"
ON public.project_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can edit project types"
ON public.project_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete project types"
ON public.project_types FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view project records"
ON public.project_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create project records"
ON public.project_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can edit project records"
ON public.project_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete project records"
ON public.project_records FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view settings"
ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can edit settings"
ON public.settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_types_updated_at
BEFORE UPDATE ON public.project_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_records_updated_at
BEFORE UPDATE ON public.project_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.settings (id, validity_years, warning_years)
VALUES (true, 5, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_types (name, abbreviation, display_order, is_active)
VALUES
  ('Licença de Operação', 'LO', 1, true),
  ('Relatório de Controle Ambiental', 'RCA', 2, true),
  ('Plano de Controle Ambiental', 'PCA', 3, true),
  ('Cadastro Técnico Federal', 'CTF', 4, true),
  ('Inventário de Resíduos', 'IR', 5, true)
ON CONFLICT (abbreviation) DO NOTHING;

CREATE INDEX idx_clients_name ON public.clients (name);
CREATE INDEX idx_project_types_active_order ON public.project_types (is_active, display_order);
CREATE INDEX idx_project_records_client ON public.project_records (client_id);
CREATE INDEX idx_project_records_type ON public.project_records (project_type_id);
CREATE INDEX idx_project_records_year ON public.project_records (year);