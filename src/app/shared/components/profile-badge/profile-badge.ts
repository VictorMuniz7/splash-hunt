import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { ProfileService } from '../../../core/services/profile.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ProfilePanel } from '../profile-panel/profile-panel';

@Component({
  selector: 'app-profile-badge',
  imports: [ProfilePanel],
  templateUrl: './profile-badge.html',
})
export class ProfileBadge {
  protected readonly supabase = inject(SupabaseService);
  protected readonly profileService = inject(ProfileService);

  private readonly hostRef: ElementRef<HTMLElement> = inject(ElementRef);

  readonly open = signal(false);

  toggle(): void {
    this.open.update((value) => !value);
  }

  initial(): string {
    const nickname = this.profileService.profile()?.nickname;
    return nickname ? nickname.charAt(0).toUpperCase() : '?';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.hostRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
