DO $$ 
DECLARE 
  t text;
BEGIN 
  FOR t IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated full access" ON %I', t);
    EXECUTE format('CREATE POLICY "Allow authenticated full access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP; 
END $$;
