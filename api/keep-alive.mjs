/**
 * Hit daily by the Vercel Cron in vercel.json. Supabase's free tier pauses a
 * project after ~7 days without activity, and only requests that actually
 * reach the database count, so this runs a real (tiny) query instead of a
 * health check. RLS makes it return no rows for the anon key, which is fine:
 * the query still runs.
 *
 * Self-contained on purpose (Vercel functions can't reliably import the
 * Angular app's .ts files): keep these two values in sync with
 * src/app/core/config/supabase.config.ts.
 */
const SUPABASE_URL = 'https://uhmeaeyfayhowqaifpgy.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVobWVhZXlmYXlob3dxYWlmcGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwODIwMDYsImV4cCI6MjEwMjY1ODAwNn0.dIvOEfGzKhU2vdMY_DQlcAq0ngt5lohEnJ_OlIyoqbM';

export async function GET() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rooms?select=id&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  return Response.json({ ok: res.ok, status: res.status }, { status: res.ok ? 200 : 502 });
}
