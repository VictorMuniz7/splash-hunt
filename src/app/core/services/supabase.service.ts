import { Injectable, signal } from '@angular/core';
import { AuthError, Session, SupabaseClient, createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/supabase.config';
import { TranslationKey } from './i18n.service';

export interface AuthResult {
  error: AuthError | null;
}

const AUTH_ERROR_KEYS: Record<string, TranslationKey> = {
  anonymous_provider_disabled: 'auth.errorAnonymousDisabled',
};

const LAST_NICKNAME_KEY = 'splash-hunt:last-nickname';

/** Last nickname used on this browser, offered back as the input placeholder. */
export function lastNickname(): string | null {
  try {
    return localStorage.getItem(LAST_NICKNAME_KEY);
  } catch {
    return null;
  }
}

function rememberNickname(nickname: string): void {
  try {
    localStorage.setItem(LAST_NICKNAME_KEY, nickname);
  } catch {
    // Storage blocked (private mode etc.): the placeholder just won't persist.
  }
}

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

  /** The nickname is purely cosmetic (not unique, freely repeatable): reuses
   * the current anonymous session if there is one and just renames it,
   * otherwise signs in anonymously with it. */
  async enterWithNickname(nickname: string): Promise<AuthResult> {
    rememberNickname(nickname);

    const userId = this.session()?.user.id;
    if (!userId) {
      const { error } = await this.client.auth.signInAnonymously({
        options: { data: { nickname, is_anonymous: true } },
      });
      return { error };
    }

    if (nickname === this.sessionNickname()) {
      return { error: null };
    }
    // profiles first: updateUser fires USER_UPDATED, which makes
    // ProfileService reload the row — it should already hold the new name.
    await this.client.from('profiles').update({ nickname }).eq('id', userId);
    const { error } = await this.client.auth.updateUser({ data: { nickname } });
    return { error };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }
}
