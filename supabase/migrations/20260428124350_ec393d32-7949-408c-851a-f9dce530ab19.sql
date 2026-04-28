DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can edit clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create project types" ON public.project_types;
DROP POLICY IF EXISTS "Authenticated users can edit project types" ON public.project_types;
DROP POLICY IF EXISTS "Authenticated users can delete project types" ON public.project_types;
DROP POLICY IF EXISTS "Authenticated users can create project records" ON public.project_records;
DROP POLICY IF EXISTS "Authenticated users can edit project records" ON public.project_records;
DROP POLICY IF EXISTS "Authenticated users can delete project records" ON public.project_records;
DROP POLICY IF EXISTS "Authenticated users can edit settings" ON public.settings;

CREATE POLICY "Logged in users can create clients"
ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Logged in users can edit clients"
ON public.clients FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Logged in users can delete clients"
ON public.clients FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Logged in users can create project types"
ON public.project_types FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Logged in users can edit project types"
ON public.project_types FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Logged in users can delete project types"
ON public.project_types FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Logged in users can create project records"
ON public.project_records FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Logged in users can edit project records"
ON public.project_records FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Logged in users can delete project records"
ON public.project_records FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Logged in users can edit settings"
ON public.settings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);