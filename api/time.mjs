/**
 * Server clock for multiplayer countdowns. Round deadlines are stamped with
 * Supabase's clock (match_rounds.started_at), so a device whose own clock is
 * off would show the wrong time left. Vercel's and Supabase's clocks are both
 * NTP-synced, so this is a good-enough stand-in for the database's now().
 */
export function GET() {
  return Response.json({ now: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
}
