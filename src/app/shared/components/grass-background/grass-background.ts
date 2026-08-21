import { AfterViewInit, Component, ElementRef, OnDestroy, inject } from '@angular/core';
import { JSAnimation, animate } from 'animejs/animation';

interface GrassCluster {
  left: number;
  width: number;
  gustDuration: number;
  gustDelay: number;
  gustAngle: number;
  colorA: string;
  colorB: string;
}

const BLADE_COLORS: [string, string][] = [
  ['#3a5c2a', '#4a7038'],
  ['#4a7038', '#5c8a45'],
  ['#2f4a22', '#436a32'],
];

@Component({
  selector: 'app-grass-background',
  templateUrl: './grass-background.html',
})
export class GrassBackground implements AfterViewInit, OnDestroy {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly animations: JSAnimation[] = [];

  readonly clusters: GrassCluster[] = Array.from({ length: 16 }, (_, index) => {
    const [colorA, colorB] = BLADE_COLORS[index % BLADE_COLORS.length];
    return {
      left: 1 + index * 6.3 + (index % 3) * 1.4,
      width: 34 + (index % 4) * 8,
      gustDuration: 900 + (index % 5) * 180,
      gustDelay: (index % 7) * 260,
      gustAngle: (index % 2 === 0 ? 1 : -1) * (5 + (index % 3) * 2),
      colorA,
      colorB,
    };
  });

  ngAfterViewInit(): void {
    const clusters = this.host.nativeElement.querySelectorAll<HTMLElement>('.grass-cluster');
    clusters.forEach((cluster) => {
      const gustAngle = Number(cluster.dataset['gustAngle']) || 6;
      const gustDuration = Number(cluster.dataset['gustDuration']) || 1100;
      const gustDelay = Number(cluster.dataset['gustDelay']) || 0;
      this.animations.push(
        animate(cluster, {
          rotate: [0, gustAngle, 0],
          duration: gustDuration,
          delay: gustDelay,
          // Sways for `gustDuration`, then holds still for a while before the
          // next gust — "grama mexendo aos poucos com pausas" instead of a
          // continuous sway, so it reads as intermittent wind, not a loop.
          loopDelay: 1600 + (gustDelay % 1800),
          loop: true,
          ease: 'inOutSine',
        }),
      );
    });
  }

  ngOnDestroy(): void {
    this.animations.forEach((instance) => instance.pause());
  }
}
