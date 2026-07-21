ALTER TABLE public.project_types
ADD COLUMN validity_years_override integer;

ALTER TABLE public.project_types
ADD CONSTRAINT project_types_validity_override_positive
CHECK (validity_years_override IS NULL OR (validity_years_override > 0 AND validity_years_override <= 50));
