CREATE POLICY "Anyone can read active sources"
ON public.knowledge_sources
FOR SELECT
TO anon
USING (is_active = true);