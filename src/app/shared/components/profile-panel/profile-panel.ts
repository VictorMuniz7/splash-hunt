import { Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GAME_MODES } from '../../../core/models/room.model';
import { I18nService } from '../../../core/services/i18n.service';
import { ProfileService } from '../../../core/services/profile.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-profile-panel',
  imports: [RouterLink],
  templateUrl: './profile-panel.html',
})
export class ProfilePanel {
  protected readonly supabase = inject(SupabaseService);
  protected readonly profileService = inject(ProfileService);
  protected readonly i18n = inject(I18nService);

  readonly closed = output<void>();

  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  readonly modes = GAME_MODES;

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  triggerUpload(): void {
    this.fileInput()?.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploading.set(true);
    this.uploadError.set(null);
    const { error } = await this.profileService.uploadAvatar(file);
    if (error) {
      this.uploadError.set(error);
    }
    this.uploading.set(false);
    input.value = '';
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.closed.emit();
  }
}
