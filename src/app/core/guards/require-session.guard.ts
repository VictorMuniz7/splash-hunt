import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

/**
 * Blocks room routes unless some session exists (anonymous counts — "jogar
 * como anônimo" navigates straight here). Awaits getSession() directly
 * instead of trusting the session signal synchronously, since on a cold
 * direct load the signal can still be null while the initial getSession()
 * call is in flight.
 */
export const requireSessionGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const { data } = await supabase.client.auth.getSession();
  if (data.session) {
    return true;
  }
  return router.createUrlTree(['/multiplayer']);
};
