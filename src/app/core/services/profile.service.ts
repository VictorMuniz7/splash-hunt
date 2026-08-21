import { Injectable, effect, inject, signal } from '@angular/core';
import { EMPTY_STATS_BY_MODE, GameModeKey, Profile, StatsByMode } from '../models/profile.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly supabase = inject(SupabaseService);

  readonly profile = signal<Profile | null>(null);
  readonly stats = signal<StatsByMode>(EMPTY_STATS_BY_MODE);
  readonly loading = signal(false);

  constructor() {
    effect(() => {
      const session = this.supabase.session();
      if (session) {
        void this.loadProfile(session.user.id);
      } else {
        this.profile.set(null);
        this.stats.set(EMPTY_STATS_BY_MODE);
      }
    });
  }

  async uploadAvatar(file: File): Promise<{ error: string | null }> {
    const userId = this.supabase.session()?.user.id;
    if (!userId) {
      return { error: 'not-authenticated' };
    }

    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await this.supabase.client.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' });
    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data: publicUrlData } = this.supabase.client.storage.from('avatars').getPublicUrl(path);
    // Cache-bust so the header icon updates immediately after re-uploading
    // over the same path instead of showing the previous cached image.
    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await this.supabase.client
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);
    if (updateError) {
      return { error: updateError.message };
    }

    this.profile.update((current) => (current ? { ...current, avatarUrl } : current));
    return { error: null };
  }

  private async loadProfile(userId: string): Promise<void> {
    this.loading.set(true);

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, nickname, avatar_url, is_anonymous, created_at')
      .eq('id', userId)
      .single();

    if (!error && data) {
      this.profile.set({
        id: data['id'],
        nickname: data['nickname'],
        avatarUrl: data['avatar_url'],
        isAnonymous: data['is_anonymous'],
        createdAt: data['created_at'],
      });
    }

    await this.loadStats(userId);
    this.loading.set(false);
  }

  private async loadStats(userId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('match_stats')
      .select('mode, result')
      .eq('profile_id', userId);

    if (error || !data) {
      return;
    }

    const next: StatsByMode = {
      padrao: { wins: 0, losses: 0 },
      vulto: { wins: 0, losses: 0 },
      preto_e_branco: { wins: 0, losses: 0 },
      anomaly: { wins: 0, losses: 0 },
    };
    for (const row of data as { mode: GameModeKey; result: 'win' | 'loss' }[]) {
      const bucket = next[row.mode];
      if (!bucket) {
        continue;
      }
      if (row.result === 'win') {
        bucket.wins += 1;
      } else {
        bucket.losses += 1;
      }
    }
    this.stats.set(next);
  }
}
