import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameModeKey } from '../../../core/models/profile.model';
import { GAME_MODES } from '../../../core/models/room.model';
import { I18nService, TranslationKey } from '../../../core/services/i18n.service';
import { roomErrorKey, RoomService } from '../../../core/services/room.service';

const NOTICE_KEYS: Record<string, TranslationKey> = {
  not_found: 'rooms.errorNotFound',
  cancelled: 'rooms.cancelledByHost',
};

@Component({
  selector: 'app-rooms-hub-page',
  templateUrl: './rooms-hub.page.html',
})
export class RoomsHubPage {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly rooms = inject(RoomService);

  protected readonly modes = GAME_MODES;

  readonly creating = signal(false);
  readonly joining = signal(false);
  readonly code = signal('');
  readonly error = signal<string | null>(this.readNotice());

  private readNotice(): string | null {
    const notice = this.route.snapshot.queryParamMap.get('notice');
    const key = notice ? NOTICE_KEYS[notice] : undefined;
    return key ? this.i18n.t(key) : null;
  }

  back(): void {
    this.router.navigateByUrl('/multiplayer');
  }

  async createRoom(mode: GameModeKey): Promise<void> {
    if (this.creating() || this.joining()) {
      return;
    }
    this.creating.set(true);
    this.error.set(null);

    const { room, error } = await this.rooms.createRoom(mode);
    this.creating.set(false);

    if (error || !room) {
      this.error.set(this.i18n.t(error ? roomErrorKey(error) : 'auth.genericError'));
      return;
    }
    this.router.navigateByUrl(`/multiplayer/salas/${room.id}`);
  }

  async joinRoom(): Promise<void> {
    const value = this.code().trim();
    if (!value || this.creating() || this.joining()) {
      return;
    }
    this.joining.set(true);
    this.error.set(null);

    const { room, error } = await this.rooms.joinRoom(value);
    this.joining.set(false);

    if (error || !room) {
      this.error.set(this.i18n.t(error ? roomErrorKey(error) : 'auth.genericError'));
      return;
    }
    this.router.navigateByUrl(`/multiplayer/salas/${room.id}`);
  }
}
