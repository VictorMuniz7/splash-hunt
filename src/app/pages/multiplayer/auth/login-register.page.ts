import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../../../core/services/i18n.service';
import { authErrorKey, SupabaseService } from '../../../core/services/supabase.service';

type Tab = 'login' | 'register';

@Component({
  selector: 'app-login-register-page',
  templateUrl: './login-register.page.html',
})
export class LoginRegisterPage {
  protected readonly i18n = inject(I18nService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly tab = signal<Tab>('login');
  readonly nickname = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly registered = signal(false);

  readonly passwordChecks = computed(() => {
    const pw = this.password();
    return {
      length: pw.length >= 8,
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
      symbol: /[^A-Za-z0-9]/.test(pw),
    };
  });

  readonly isPasswordStrong = computed(() => Object.values(this.passwordChecks()).every(Boolean));

  readonly canSubmitRegister = computed(
    () =>
      this.nickname().trim().length > 0 &&
      this.email().trim().length > 0 &&
      this.isPasswordStrong() &&
      this.password() === this.confirmPassword(),
  );

  readonly canSubmitLogin = computed(() => this.email().trim().length > 0 && this.password().length > 0);

  setTab(tab: Tab): void {
    this.tab.set(tab);
    this.error.set(null);
    this.registered.set(false);
  }

  back(): void {
    this.router.navigateByUrl('/multiplayer');
  }

  async submitRegister(): Promise<void> {
    if (!this.canSubmitRegister()) {
      if (this.password() !== this.confirmPassword()) {
        this.error.set(this.i18n.t('auth.passwordMismatch'));
      }
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    const { error } = await this.supabase.signUp(this.email().trim(), this.password(), this.nickname().trim());
    this.submitting.set(false);

    if (error) {
      this.error.set(this.i18n.t(authErrorKey(error)));
      return;
    }
    this.registered.set(true);
  }

  async submitLogin(): Promise<void> {
    if (!this.canSubmitLogin()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const { error } = await this.supabase.signInWithPassword(this.email().trim(), this.password());
    this.submitting.set(false);

    if (error) {
      this.error.set(this.i18n.t(authErrorKey(error)));
      return;
    }
    this.router.navigateByUrl('/multiplayer');
  }
}
