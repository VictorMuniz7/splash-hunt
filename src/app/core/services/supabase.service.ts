import { Injectable, signal } from '@angular/core';
import { AuthError, Session, SupabaseClient, createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/supabase.config';
import { TranslationKey } from './i18n.service';

export interface AuthResult {
  error: AuthError | null;
}

const AUTH_ERROR_KEYS: Record<string, TranslationKey> = {
  email_not_confirmed: 'auth.errorEmailNotConfirmed',
  invalid_credentials: 'auth.errorInvalidCredentials',
  user_already_exists: 'auth.errorUserExists',
  email_exists: 'auth.errorUserExists',
  weak_password: 'auth.errorWeakPassword',
  email_address_invalid: 'auth.errorInvalidEmail',
  validation_failed: 'auth.errorInvalidEmail',
  anonymous_provider_disabled: 'auth.errorAnonymousDisabled',
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

  /** The nickname passed at signup/anonymous sign-in — available immediately,
   * before the `profiles` row (source of truth, kept in sync by ProfileService)
   * has had a chance to load. */
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

  async signUp(email: string, password: string, nickname: string): Promise<AuthResult> {
    const { error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });
    return { error };
  }

  async signInWithPassword(email: string, password: string): Promise<AuthResult> {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    return { error };
  }

  async signInAnonymously(nickname: string): Promise<AuthResult> {
    const { error } = await this.client.auth.signInAnonymously({
      options: { data: { nickname, is_anonymous: true } },
    });
    return { error };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }
}
