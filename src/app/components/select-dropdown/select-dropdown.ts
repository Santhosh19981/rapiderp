import { Component, DestroyRef, ElementRef, HostListener, computed, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
  value: string | number;
  label: string;
  description?: string;
}

/**
 * Single-select dropdown with title + description rows.
 * `showToggle` adds a switch per row (on = selected), used by the Country module.
 */
@Component({
  selector: 'app-select-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-dropdown.html',
  styleUrl: './select-dropdown.css',
})
export class SelectDropdown {
  private host = inject(ElementRef<HTMLElement>);

  readonly options = input<DropdownOption[]>([]);
  readonly value = model<string | number | null>(null);
  readonly label = input<string>('');
  readonly required = input<boolean>(false);
  readonly showToggle = input<boolean>(false);
  readonly inputId = input<string | undefined>(undefined);
  readonly placeholder = input<string>('Select');
  // floating: pill with notch label (forms); plain: compact box for panels/drawers
  readonly variant = input<'floating' | 'plain'>('floating');
  readonly invalid = input<boolean>(false);

  // Fired after a choice made with the keyboard, so forms can move focus on
  readonly committed = output<void>();

  isOpen = signal<boolean>(false);
  activeIndex = signal<number>(-1);
  panelStyle = signal<Record<string, string>>({});

  selected = computed(() => this.options().find((o) => o.value === this.value()) ?? null);

  toggleOpen(): void {
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    // Fixed positioning so scrolling containers (forms, drawers) can't clip the list
    const rect = this.host.nativeElement.getBoundingClientRect();
    const estimated = Math.min(this.options().length * 64 + 12, 320);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimated + 12 && rect.top > spaceBelow;
    this.panelStyle.set({
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      ...(openUp
        ? { bottom: `${window.innerHeight - rect.top + 6}px` }
        : { top: `${rect.bottom + 6}px` }),
    });
    const idx = this.options().findIndex((o) => o.value === this.value());
    this.activeIndex.set(idx >= 0 ? idx : 0);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  choose(option: DropdownOption, fromKeyboard = false): void {
    this.value.set(option.value);
    this.close();
    if (fromKeyboard) this.committed.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
          return;
        }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        this.activeIndex.update((i) => (i + step + count) % count);
        break;
      }
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.isOpen() && this.activeIndex() >= 0) {
          this.choose(this.options()[this.activeIndex()], true);
        } else {
          this.open();
        }
        break;
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          event.stopPropagation();
          this.close();
        }
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  // The list is pinned to the viewport, so close it rather than let it drift on scroll/resize
  @HostListener('window:resize')
  onResize(): void {
    if (this.isOpen()) this.close();
  }

  // Capture phase for both: nested scrolls don't bubble, and modals/drawers stop click propagation
  private closeIfOutside = (event: Event) => {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  };

  constructor() {
    window.addEventListener('scroll', this.closeIfOutside, true);
    window.addEventListener('pointerdown', this.closeIfOutside, true);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('scroll', this.closeIfOutside, true);
      window.removeEventListener('pointerdown', this.closeIfOutside, true);
    });
  }
}
