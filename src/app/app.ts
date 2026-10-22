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
      let preferredPos = target.getAttribute('data-tooltip-pos');

      // Smart positioning if not explicitly specified:
      if (!preferredPos) {
        if (rect.top < 75) {
          preferredPos = 'bottom'; // Top edge collision -> point UP ▲ (Exact match to Reference Image 3)
        } else if (rect.bottom > window.innerHeight - 60) {
          preferredPos = 'top'; // Bottom edge collision -> point DOWN ▼
        } else if (rect.right > window.innerWidth - 130) {
          preferredPos = 'left'; // Right edge collision -> point RIGHT ▶
        } else if (rect.left < 100) {
          preferredPos = 'right'; // Left edge collision -> point LEFT ◀
        } else {
          preferredPos = rect.top < 120 ? 'bottom' : 'top';
        }
      }

      tooltipEl!.setAttribute('data-pos', preferredPos);
      tooltipEl!.classList.add('active');

      const tooltipRect = tooltipEl!.getBoundingClientRect();
      const tooltipW = tooltipRect.width || 120;
      const tooltipH = tooltipRect.height || 26;

      let top = 0;
      let left = 0;
      let caretLeft = '50%';
      let caretTop = '50%';

      if (preferredPos === 'bottom') {
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        // Clamp left so tooltip never falls outside viewport
        const clampedLeft = Math.max(8, Math.min(window.innerWidth - tooltipW - 8, left));
        const caretOffset = (rect.left + rect.width / 2) - clampedLeft;
        caretLeft = `${Math.max(10, Math.min(tooltipW - 10, caretOffset))}px`;
        left = clampedLeft;
      } else if (preferredPos === 'top') {
        top = rect.top - tooltipH - 8;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        const clampedLeft = Math.max(8, Math.min(window.innerWidth - tooltipW - 8, left));
        const caretOffset = (rect.left + rect.width / 2) - clampedLeft;
        caretLeft = `${Math.max(10, Math.min(tooltipW - 10, caretOffset))}px`;
        left = clampedLeft;
      } else if (preferredPos === 'left') {
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - tooltipW - 8;
        const clampedTop = Math.max(8, Math.min(window.innerHeight - tooltipH - 8, top));
        const caretOffset = (rect.top + rect.height / 2) - clampedTop;
        caretTop = `${Math.max(8, Math.min(tooltipH - 8, caretOffset))}px`;
        top = clampedTop;
      } else if (preferredPos === 'right') {
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + 8;
        const clampedTop = Math.max(8, Math.min(window.innerHeight - tooltipH - 8, top));
        const caretOffset = (rect.top + rect.height / 2) - clampedTop;
        caretTop = `${Math.max(8, Math.min(tooltipH - 8, caretOffset))}px`;
        top = clampedTop;
      }

      tooltipEl!.style.top = `${Math.round(top)}px`;
      tooltipEl!.style.left = `${Math.round(left)}px`;
      if (preferredPos === 'bottom' || preferredPos === 'top') {
        caretEl.style.left = '50%';
        caretEl.style.top = '';
        caretEl.style.transform = 'translateX(-50%)';
      } else {
        caretEl.style.top = '50%';
        caretEl.style.left = '';
        caretEl.style.transform = 'translateY(-50%)';
      }
    };

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
