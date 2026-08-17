import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';
import { animate } from 'animejs/animation';

@Directive({
  selector: '[appEnterAnimate]',
})
export class EnterAnimateDirective implements AfterViewInit {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  ngAfterViewInit(): void {
    animate(this.host.nativeElement, {
      opacity: [0, 1],
      translateX: [16, 0],
      duration: 380,
      ease: 'outQuad',
    });
  }
}
