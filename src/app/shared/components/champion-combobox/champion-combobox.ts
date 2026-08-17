import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';

export interface ComboOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-combobox',
  templateUrl: './champion-combobox.html',
})
export class ChampionCombobox {
  protected readonly i18n = inject(I18nService);

  readonly options = input<ComboOption[]>([]);
  readonly placeholder = input('Buscar...');
  readonly disabled = input(false);
  readonly selected = model<ComboOption | null>(null);

  readonly query = signal('');
  readonly open = signal(false);
  readonly highlightedIndex = signal(0);
  /** Opens the panel upward instead of downward when there isn't enough room below. */
  readonly dropUp = signal(false);

  private readonly hostRef: ElementRef<HTMLElement> = inject(ElementRef);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const opts = this.options();
    const matches = q ? opts.filter((option) => option.label.toLowerCase().includes(q)) : opts;
    return matches.slice(0, 50);
  });

  constructor() {
    effect(() => {
      const current = this.selected();
      this.query.set(current ? current.label : '');
    });
  }

  onInput(value: string): void {
    this.query.set(value);
    this.openPanel();
    this.highlightedIndex.set(0);
    if (this.selected()) {
      this.selected.set(null);
    }
  }

  onFocus(): void {
    // Only auto-open on focus when there's nothing chosen yet — reopening a
    // field that already holds a valid selection would swallow the next
    // Enter keypress (it would re-confirm the highlighted item instead of
    // letting Enter bubble up to submit the attempt).
    if (!this.disabled() && !this.selected()) {
      this.openPanel();
    }
  }

  select(option: ComboOption): void {
    this.selected.set(option);
    this.query.set(option.label);
    this.open.set(false);
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.open()) {
      return;
    }
    const list = this.filtered();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedIndex.update((i) => Math.min(i + 1, list.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      const option = list[this.highlightedIndex()];
      if (option) {
        event.preventDefault();
        event.stopPropagation();
        this.select(option);
      }
    } else if (event.key === 'Escape') {
      this.open.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.hostRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  optionClass(index: number): string {
    const base = 'block w-full cursor-pointer px-4 py-2 text-left text-sm transition';
    return index === this.highlightedIndex()
      ? `${base} bg-splash-magenta/25 text-white`
      : `${base} text-[#f4e9d8] hover:bg-white/5`;
  }

  private openPanel(): void {
    // Flip the panel above the field when it's low enough on the page that
    // opening downward would run it off-screen (cramped against the bottom
    // of the viewport, hard to scroll through and pick an option).
    const rect = this.hostRef.nativeElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    this.dropUp.set(spaceBelow < 260 && spaceAbove > spaceBelow);
    this.open.set(true);
  }
}
