import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { GAME_MODES, RoomWithProfiles } from '../../../core/models/room.model';
import { I18nService } from '../../../core/services/i18n.service';
import { roomErrorKey, RoomService } from '../../../core/services/room.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-room-lobby-page',
  templateUrl: './room-lobby.page.html',
})
export class RoomLobbyPage implements OnInit, OnDestroy {
  protected readonly i18n = inject(I18nService);
  protected readonly supabase = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rooms = inject(RoomService);

  private readonly roomId = this.route.snapshot.paramMap.get('roomId')!;
  private channel: RealtimeChannel | null = null;

  readonly room = signal<RoomWithProfiles | null>(null);
  readonly loading = signal(true);
  readonly acting = signal(false);
  readonly error = signal<string | null>(null);
  readonly copied = signal(false);

  readonly isHost = computed(() => this.room()?.hostId === this.supabase.session()?.user.id);
  readonly modeLabelKey = computed(() => GAME_MODES.find((m) => m.key === this.room()?.mode)?.labelKey);

  async ngOnInit(): Promise<void> {
    const room = await this.rooms.fetchRoomWithProfiles(this.roomId);
    this.loading.set(false);

    if (!room) {
      this.router.navigate(['/multiplayer/salas'], { queryParams: { notice: 'not_found' } });
      return;
    }

    this.room.set(room);
    if (room.status === 'playing') {
      this.goToMatch();
      return;
    }

    this.channel = this.rooms.subscribeToRoom(this.roomId, (kind) => this.onRoomEvent(kind));
  }

  ngOnDestroy(): void {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
    }
  }

  private async onRoomEvent(kind: 'change' | 'deleted'): Promise<void> {
    if (kind === 'deleted') {
      this.router.navigate(['/multiplayer/salas'], { queryParams: { notice: 'cancelled' } });
      return;
    }

    const room = await this.rooms.fetchRoomWithProfiles(this.roomId);
    if (!room) {
      this.router.navigate(['/multiplayer/salas'], { queryParams: { notice: 'not_found' } });
      return;
    }
    this.room.set(room);
    if (room.status === 'playing') {
      this.goToMatch();
    }
  }

  async copyCode(): Promise<void> {
    const room = this.room();
    if (!room) {
      return;
    }
    await navigator.clipboard.writeText(room.code);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  async startMatch(): Promise<void> {
    if (this.acting()) {
      return;
    }
    this.acting.set(true);
    this.error.set(null);

    const { room, error } = await this.rooms.startMatch(this.roomId);
    this.acting.set(false);

    if (error || !room) {
      this.error.set(this.i18n.t(error ? roomErrorKey(error) : 'auth.genericError'));
      return;
    }
    this.goToMatch();
  }

  async leaveOrCancel(): Promise<void> {
    if (this.acting()) {
      return;
    }
    this.acting.set(true);
    await this.rooms.leaveRoom(this.roomId);
    this.acting.set(false);
    this.router.navigateByUrl('/multiplayer/salas');
  }

  private goToMatch(): void {
    this.router.navigateByUrl(`/multiplayer/salas/${this.roomId}/partida`);
  }
}
