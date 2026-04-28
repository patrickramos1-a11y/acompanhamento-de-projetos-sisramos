
DROP POLICY IF EXISTS "Logged in users can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Logged in users can edit clients" ON public.clients;
DROP POLICY IF EXISTS "Logged in users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;

DROP POLICY IF EXISTS "Logged in users can delete project types" ON public.project_types;
DROP POLICY IF EXISTS "Logged in users can edit project types" ON public.project_types;
DROP POLICY IF EXISTS "Logged in users can create project types" ON public.project_types;
DROP POLICY IF EXISTS "Authenticated users can view project types" ON public.project_types;

DROP POLICY IF EXISTS "Logged in users can delete project records" ON public.project_records;
DROP POLICY IF EXISTS "Logged in users can edit project records" ON public.project_records;
DROP POLICY IF EXISTS "Logged in users can create project records" ON public.project_records;
DROP POLICY IF EXISTS "Authenticated users can view project records" ON public.project_records;

DROP POLICY IF EXISTS "Logged in users can edit settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.settings;

CREATE POLICY "Public full access" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.project_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.project_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.settings FOR ALL USING (true) WITH CHECK (true);
