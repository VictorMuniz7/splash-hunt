import { AfterViewInit, Component, ElementRef, OnDestroy, effect, inject } from '@angular/core';
import { JSAnimation, animate } from 'animejs/animation';
import { AmbianceService } from '../../../core/services/ambiance.service';

const BASE_OPACITY = [0.3, 0.4, 0.5];
const HOVER_OPACITY = [0.5, 0.62, 0.78];

@Component({
  selector: 'app-wave-background',
  templateUrl: './wave-background.html',
})
export class WaveBackground implements AfterViewInit, OnDestroy {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly ambiance = inject(AmbianceService);
  private readonly loopAnimations: JSAnimation[] = [];

  constructor() {
    // Reacts to the menu's start-button hover (set via AmbianceService) by
    // making the wave tiers taller/brighter and glowing a spotlight centered
    // under the button, so the waves feel like they respond to it.
    effect(() => {
      const hovering = this.ambiance.heroHover();

      const tiers = this.host.nativeElement.querySelectorAll<HTMLElement>('.wave-tier');
      tiers.forEach((tier, index) => {
        animate(tier, {
          scaleY: hovering ? 1.15 + index * 0.06 : 1,
          duration: 900,
          ease: 'outQuad',
        });
      });

      const tracks = this.host.nativeElement.querySelectorAll<HTMLElement>('.wave-track');
      tracks.forEach((track, index) => {
        animate(track, {
          opacity: hovering ? HOVER_OPACITY[index] : BASE_OPACITY[index],
          duration: 900,
          ease: 'outQuad',
        });
      });

      const spotlight = this.host.nativeElement.querySelector<HTMLElement>('.hero-spotlight');
      if (spotlight) {
        animate(spotlight, {
          backgroundColor: hovering ? 'rgba(178,58,237,0.35)' : 'rgba(178,58,237,0)',
          duration: 900,
          ease: 'outQuad',
        });
      }
    });
  }

  ngAfterViewInit(): void {
    const tracks = this.host.nativeElement.querySelectorAll<HTMLElement>('.wave-track');
    tracks.forEach((track) => {
      const duration = Number(track.dataset['duration']) || 30000;
      const reverse = track.dataset['direction'] === 'reverse';
      this.loopAnimations.push(
        animate(track, {
          translateX: reverse ? ['-50%', '0%'] : ['0%', '-50%'],
          duration,
          ease: 'linear',
          loop: true,
        }),
      );
    });
  }

  ngOnDestroy(): void {
    this.loopAnimations.forEach((instance) => instance.pause());
  }
}
