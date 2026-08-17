import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { DDRAGON_BASE } from '../config/game.config';
import { ChampionDetail, ChampionSummary, Skin, SplashOption } from '../models/champion.model';
import { I18nService } from './i18n.service';

interface ChampionListResponse {
  data: Record<string, ChampionSummary>;
}

interface ChampionDetailResponse {
  data: Record<string, ChampionDetail>;
}

/**
 * Talks to Riot's Data Dragon CDN. Only the lightweight JSON (patch version +
 * champion list, and per-champion detail on demand) is ever fetched and cached
 * in memory for the session — splash art is always loaded directly from the
 * CDN by the browser via <img>, never downloaded/stored by the app.
 *
 * Champion/skin data is cached per locale (one fetch per locale actually
 * used this session), since the language switcher lets the player flip
 * between pt_BR and en_US Data Dragon data.
 */
@Injectable({ providedIn: 'root' })
export class DataDragonService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);

  private version$?: Observable<string>;
  private readonly champions$ = new Map<string, Observable<ChampionSummary[]>>();
  private readonly detailCache = new Map<string, ChampionDetail>();
  private readonly detailRequests = new Map<string, Observable<ChampionDetail>>();

  getVersion(): Observable<string> {
    if (!this.version$) {
      this.version$ = this.http.get<string[]>(`${DDRAGON_BASE}/api/versions.json`).pipe(
        map((versions) => versions[0]),
        shareReplay(1),
      );
    }
    return this.version$;
  }

  getChampions(): Observable<ChampionSummary[]> {
    const locale = this.i18n.ddragonLocale;
    let cached = this.champions$.get(locale);
    if (!cached) {
      cached = this.getVersion().pipe(
        switchMap((version) =>
          this.http.get<ChampionListResponse>(`${DDRAGON_BASE}/cdn/${version}/data/${locale}/champion.json`),
        ),
        map((response) => Object.values(response.data).sort((a, b) => a.name.localeCompare(b.name))),
        shareReplay(1),
      );
      this.champions$.set(locale, cached);
    }
    return cached;
  }

  /** Fetches (and caches, per locale) the detail file for one champion, which is the only place skins live. */
  getChampionDetail(championId: string): Observable<ChampionDetail> {
    const locale = this.i18n.ddragonLocale;
    const cacheKey = `${locale}:${championId}`;

    const cached = this.detailCache.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    const pending = this.detailRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    const request$ = this.getVersion().pipe(
      switchMap((version) =>
        this.http.get<ChampionDetailResponse>(
          `${DDRAGON_BASE}/cdn/${version}/data/${locale}/champion/${championId}.json`,
        ),
      ),
      map((response) => response.data[championId]),
      tap((detail) => {
        this.detailCache.set(cacheKey, detail);
        this.detailRequests.delete(cacheKey);
      }),
      shareReplay(1),
    );

    this.detailRequests.set(cacheKey, request$);
    return request$;
  }

  /**
   * Chroma variants (e.g. "Popstar Ahri (Amethyst)") reuse their parent skin's
   * splash art and have no splash file of their own on the CDN — they must be
   * filtered out before showing skins or picking a random target.
   */
  realSkins(detail: ChampionDetail): Skin[] {
    return detail.skins.filter((skin) => skin.parentSkin === undefined);
  }

  skinLabel(skin: Skin): string {
    return skin.num === 0 ? 'Original' : skin.name;
  }

  buildSplashUrl(championId: string, skinNum: number): string {
    return `${DDRAGON_BASE}/cdn/img/champion/splash/${championId}_${skinNum}.jpg`;
  }

  toSplashOption(detail: ChampionDetail, skin: Skin): SplashOption {
    return {
      championId: detail.id,
      championName: detail.name,
      skinNum: skin.num,
      skinLabel: this.skinLabel(skin),
      splashUrl: this.buildSplashUrl(detail.id, skin.num),
    };
  }

  /**
   * Picks a random champion from the already-cached summary list, then fetches
   * only that one champion's detail to pick a random real skin — avoids ever
   * fetching every champion's detail file just to build one round.
   */
  getRandomSplashOption(): Observable<SplashOption> {
    return this.getChampions().pipe(
      switchMap((champions) => {
        const champion = champions[Math.floor(Math.random() * champions.length)];
        return this.getChampionDetail(champion.id);
      }),
      map((detail) => {
        const skins = this.realSkins(detail);
        const skin = skins[Math.floor(Math.random() * skins.length)];
        return this.toSplashOption(detail, skin);
      }),
    );
  }
}
