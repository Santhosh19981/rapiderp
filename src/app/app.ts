import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('rapiderp');

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      this.initGlobalTooltip();
    }
  }

  private initGlobalTooltip(): void {
    let tooltipEl = document.getElementById('rapiderp-global-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'rapiderp-global-tooltip';
      tooltipEl.innerHTML = '<div id="rapiderp-tooltip-caret"></div><span id="rapiderp-tooltip-text"></span>';
      document.body.appendChild(tooltipEl);
    }

    const caretEl = tooltipEl.querySelector('#rapiderp-tooltip-caret') as HTMLElement;
    const textEl = tooltipEl.querySelector('#rapiderp-tooltip-text') as HTMLElement;

    let currentTarget: HTMLElement | null = null;
    let hideTimer: any = null;

    const hideTooltip = () => {
      if (tooltipEl) {
        tooltipEl.classList.remove('active');
        tooltipEl.removeAttribute('data-theme');
      }
      currentTarget = null;
    };

    const showTooltipFor = (target: HTMLElement) => {
      clearTimeout(hideTimer);
      let text = target.getAttribute('data-tooltip') || target.getAttribute('title') || '';
      text = text.trim();
      if (!text) {
        hideTooltip();
        return;
      }

      // Convert title attribute to data-tooltip to suppress native OS tooltips
      if (target.hasAttribute('title')) {
        target.setAttribute('data-tooltip', text);
        target.removeAttribute('title');
      }

      currentTarget = target;
      textEl.textContent = text;

      const theme = target.getAttribute('data-tooltip-theme');
      if (theme) {
        tooltipEl!.setAttribute('data-theme', theme);
      } else {
        tooltipEl!.removeAttribute('data-theme');
      }

      // Position logic: calculate target bounds
      const rect = target.getBoundingClientRect();
      const explicitPos = target.getAttribute('data-tooltip-pos');

      tooltipEl!.classList.add('active');
      const tooltipRect = tooltipEl!.getBoundingClientRect();
      const tooltipW = tooltipRect.width || 80;
      const tooltipH = tooltipRect.height || 26;

      // Helper: check if a candidate box overlaps other buttons/interactive controls
      const collidesWithButtons = (l: number, t: number, w: number, h: number): boolean => {
        const r = l + w;
        const b = t + h;
        const buttons = document.querySelectorAll('button, a, input, select, textarea, [role="button"], .capsule-card');
        for (let i = 0; i < buttons.length; i++) {
          const btn = buttons[i] as HTMLElement;
          if (btn === target || !btn.offsetParent) continue;
          const bRect = btn.getBoundingClientRect();
          if (Math.abs(bRect.left - l) > 250 || Math.abs(bRect.top - t) > 150) continue;
          const overlaps = !(r <= bRect.left + 2 || l >= bRect.right - 2 || b <= bRect.top + 2 || t >= bRect.bottom - 2);
          if (overlaps) return true;
        }
        return false;
      };

      let chosenPos = explicitPos || '';
      let top = 0;
      let left = 0;

      // 1. Floating card hover actions (Edit, Delete, Status Toggle on cards):
      // Position to the left in the blank space beside the buttons so sibling buttons are never obscured
      const hoverActions = target.closest('.card-hover-actions') as HTMLElement;
      if (hoverActions) {
        const groupRect = hoverActions.getBoundingClientRect();
        chosenPos = 'left';
        left = groupRect.left - tooltipW - 8;
        top = rect.top + rect.height / 2 - tooltipH / 2;
      } else {
        // 2. Candidate positions: evaluate top, bottom, left, right in blank space
        const candidates: { pos: string; top: number; left: number }[] = [];

        // Check if inside pill button group (e.g. Overview + List switchers)
        const pillGroup = target.closest('.bg-slate-100, [class*="p-0.5 rounded-full"]') as HTMLElement;
        if (pillGroup) {
          const groupRect = pillGroup.getBoundingClientRect();
          if (groupRect.top >= tooltipH + 8) {
            candidates.push({ pos: 'top', top: groupRect.top - tooltipH - 8, left: rect.left + rect.width / 2 - tooltipW / 2 });
          }
          if (groupRect.left >= tooltipW + 8) {
            candidates.push({ pos: 'left', top: groupRect.top + groupRect.height / 2 - tooltipH / 2, left: groupRect.left - tooltipW - 8 });
          }
        }

        // Top candidate (blank space above button)
        if (rect.top >= tooltipH + 8) {
          candidates.push({ pos: 'top', top: rect.top - tooltipH - 8, left: rect.left + rect.width / 2 - tooltipW / 2 });
        }
        // Bottom candidate (blank space below button or header)
        const headerEl = target.closest('header, .app-header, .country-header, .item-grid-header, [class*="header"]') as HTMLElement;
        const bottomBase = headerEl ? headerEl.getBoundingClientRect().bottom + 6 : rect.bottom + 8;
        if (bottomBase + tooltipH <= window.innerHeight - 8) {
          candidates.push({ pos: 'bottom', top: bottomBase, left: rect.left + rect.width / 2 - tooltipW / 2 });
        }
        // Left candidate (blank space beside button)
        if (rect.left >= tooltipW + 8) {
          candidates.push({ pos: 'left', top: rect.top + rect.height / 2 - tooltipH / 2, left: rect.left - tooltipW - 8 });
        }
        // Right candidate (blank space beside button)
        if (rect.right + tooltipW + 8 <= window.innerWidth) {
          candidates.push({ pos: 'right', top: rect.top + rect.height / 2 - tooltipH / 2, left: rect.right + 8 });
        }

        // If explicitPos was requested, prioritize matching candidate
        if (explicitPos) {
          const match = candidates.find(c => c.pos === explicitPos && !collidesWithButtons(c.left, c.top, tooltipW, tooltipH));
          if (match) {
            chosenPos = match.pos;
            top = match.top;
            left = match.left;
          }
        }

        // If not chosen yet, pick first candidate with zero collision with other buttons
        if (!chosenPos && candidates.length > 0) {
          const nonColliding = candidates.find(c => !collidesWithButtons(c.left, c.top, tooltipW, tooltipH));
          if (nonColliding) {
            chosenPos = nonColliding.pos;
            top = nonColliding.top;
            left = nonColliding.left;
          } else {
            chosenPos = candidates[0].pos;
            top = candidates[0].top;
            left = candidates[0].left;
          }
        }
      }

      if (!chosenPos) {
        chosenPos = rect.top < 60 ? 'bottom' : 'top';
        top = chosenPos === 'bottom' ? rect.bottom + 8 : rect.top - tooltipH - 8;
        left = rect.left + rect.width / 2 - tooltipW / 2;
      }

      tooltipEl!.setAttribute('data-pos', chosenPos);

      // Clamp left/top within viewport and align caret
      if (chosenPos === 'bottom' || chosenPos === 'top') {
        const clampedLeft = Math.max(8, Math.min(window.innerWidth - tooltipW - 8, left));
        const caretOffset = (rect.left + rect.width / 2) - clampedLeft;
        const caretLeft = `${Math.max(10, Math.min(tooltipW - 10, caretOffset))}px`;
        left = clampedLeft;
        caretEl.style.left = caretLeft;
        caretEl.style.top = '';
        caretEl.style.transform = 'translateX(-50%)';
      } else {
        const clampedTop = Math.max(8, Math.min(window.innerHeight - tooltipH - 8, top));
        const caretOffset = (rect.top + rect.height / 2) - clampedTop;
        const caretTop = `${Math.max(8, Math.min(tooltipH - 8, caretOffset))}px`;
        top = clampedTop;
        caretEl.style.top = caretTop;
        caretEl.style.left = '';
        caretEl.style.transform = 'translateY(-50%)';
      }

      tooltipEl!.style.top = `${Math.round(top)}px`;
      tooltipEl!.style.left = `${Math.round(left)}px`;
    };

    // Proactively suppress native browser black tooltips by converting title to data-tooltip immediately
    document.addEventListener('mouseenter', (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.('[title]') as HTMLElement | null;
      if (el && el.hasAttribute('title')) {
        const val = el.getAttribute('title')?.trim();
        if (val) el.setAttribute('data-tooltip', val);
        el.removeAttribute('title');
      }
    }, { capture: true, passive: true });

    document.addEventListener('mouseover', (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-tooltip],[title]') as HTMLElement | null;
      if (target) {
        showTooltipFor(target);
      }
    }, { capture: true, passive: true });

    document.addEventListener('mouseout', (e: MouseEvent) => {
      if (currentTarget) {
        const related = e.relatedTarget as HTMLElement | null;
        if (!related || !currentTarget.contains(related)) {
          hideTooltip();
        }
      }
    }, { capture: true, passive: true });

    window.addEventListener('scroll', () => {
      if (currentTarget) hideTooltip();
    }, { passive: true });

    document.addEventListener('mousedown', () => {
      hideTooltip();
    }, { passive: true });
  }
}
