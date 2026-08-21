import { Injectable, signal } from '@angular/core';
import { AuthError, Session, SupabaseClient, createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/supabase.config';
import { TranslationKey } from './i18n.service';

export interface AuthResult {
  error: AuthError | null;
}

const AUTH_ERROR_KEYS: Record<string, TranslationKey> = {
  anonymous_provider_disabled: 'auth.errorAnonymousDisabled',
  // The nickname-uniqueness check (profiles.nickname) is enforced by the
  // handle_new_user trigger, not by Supabase Auth itself — a collision there
  // surfaces as this generic code. Nothing else in that trigger can fail, so
  // mapping it straight to "nickname taken" is accurate for this flow (the
  // common case is caught earlier by isNicknameTaken's pre-check; this is
  // just the race-condition fallback for two players claiming it at once).
  unexpected_failure: 'mp.errorNicknameTaken',
};

/** Maps a Supabase AuthError (always English) to a translation key so the UI
 * can show a localized, friendly message instead of the raw API text. */
export function authErrorKey(error: AuthError): TranslationKey {
  return (error.code && AUTH_ERROR_KEYS[error.code]) || 'auth.genericError';
}

/**
 * Thin wrapper around the Supabase client: owns the singleton instance and
 * mirrors the current session into a signal so the rest of the app can react
 * to login/logout without touching the SDK directly.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  readonly session = signal<Session | null>(null);
  readonly isLoggedIn = () => this.session() !== null && !this.session()?.user.is_anonymous;
  readonly isAnonymous = () => this.session()?.user.is_anonymous === true;

  /** The nickname passed at sign-in — available immediately, before the
   * `profiles` row (source of truth, kept in sync by ProfileService) has had
   * a chance to load. */
  readonly sessionNickname = (): string | null => {
    const metadata = this.session()?.user.user_metadata;
    const nickname = metadata?.['nickname'];
    return typeof nickname === 'string' ? nickname : null;
  };

  constructor() {
    this.client.auth.getSession().then(({ data }) => this.session.set(data.session));
    this.client.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
    });
  }

  async signInAnonymously(nickname: string): Promise<AuthResult> {
    const { error } = await this.client.auth.signInAnonymously({
      options: { data: { nickname, is_anonymous: true } },
    });
    return { error };
  }

  /** Pre-check so a taken nickname is caught before even attempting sign-in. */
  async isNicknameTaken(nickname: string): Promise<boolean> {
    const { data } = await this.client.from('profiles').select('id').eq('nickname', nickname).maybeSingle();
    return !!data;
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }
}
