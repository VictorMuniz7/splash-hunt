/**
 * The anon key is meant to be public: it only grants what the database's Row
 * Level Security policies (see supabase/schema.sql) allow, it is not a
 * secret by itself.
 *
 * api/keep-alive.mjs (the Vercel Cron that stops Supabase from pausing the
 * project) has its own copy of both values: update it too when they change.
 */
export const SUPABASE_URL = 'https://uhmeaeyfayhowqaifpgy.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVobWVhZXlmYXlob3dxYWlmcGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwODIwMDYsImV4cCI6MjEwMjY1ODAwNn0.dIvOEfGzKhU2vdMY_DQlcAq0ngt5lohEnJ_OlIyoqbM';
