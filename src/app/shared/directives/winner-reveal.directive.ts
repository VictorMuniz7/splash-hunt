import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';
import { animate } from 'animejs/animation';

/** A stronger, more dramatic entrance than appEnterAnimate — for the match results' winner reveal. */
@Directive({
  selector: '[appWinnerReveal]',
})
export class WinnerRevealDirective implements AfterViewInit {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  ngAfterViewInit(): void {
    animate(this.host.nativeElement, {
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 700,
      ease: 'outBack',
    });
  }
}
