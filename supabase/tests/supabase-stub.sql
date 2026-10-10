-- Minimal Supabase emulation for testing migrations on plain Postgres 16.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

CREATE SCHEMA auth;
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT,
  raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid $$;
CREATE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'role' $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;

-- Supabase default grants on public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- PostGIS stand-ins (geometry logic is not under test)
CREATE DOMAIN geography AS TEXT;
CREATE FUNCTION ST_MakePoint(double precision, double precision) RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$ SELECT 'POINT(' || $1 || ' ' || $2 || ')' $$;
CREATE FUNCTION ST_SetSRID(TEXT, INTEGER) RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$ SELECT $1 $$;
CREATE FUNCTION ST_Distance(TEXT, TEXT) RETURNS double precision LANGUAGE sql IMMUTABLE AS $$ SELECT 0::double precision $$;
CREATE FUNCTION ST_DWithin(TEXT, TEXT, double precision) RETURNS BOOLEAN LANGUAGE sql IMMUTABLE AS $$ SELECT true $$;
