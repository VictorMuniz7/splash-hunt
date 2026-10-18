import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../src/app/core/config/supabase.config';

/**
 * Hit daily by the Vercel Cron in vercel.json. Supabase's free tier pauses a
 * project after ~7 days without activity, and only requests that actually
 * reach the database count — so this runs a real (tiny) query instead of a
 * health check. RLS makes it return no rows for the anon key, which is fine:
 * the query still runs.
 */
export async function GET(): Promise<Response> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rooms?select=id&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  return Response.json({ ok: res.ok, status: res.status }, { status: res.ok ? 200 : 502 });
}
