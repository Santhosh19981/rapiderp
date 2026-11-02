import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private deferredPrompt: any = null;

  isStandalone = signal<boolean>(false);
  isIos = signal<boolean>(false);
  canInstall = signal<boolean>(false);
  showInstallBanner = signal<boolean>(false);
  showIosInstructions = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkStandaloneMode();
      this.detectPlatform();
      this.initInstallPromptListener();
    }
  }

  private checkStandaloneMode(): void {
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as any).standalone === true;
    const standalone = isStandaloneDisplay || isIosStandalone;
    this.isStandalone.set(standalone);

    // If already installed and running standalone, do not show banner
    if (standalone) {
      this.showInstallBanner.set(false);
    }
  }

  private detectPlatform(): void {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    this.isIos.set(isIosDevice);

    // If iOS and not standalone and not dismissed, allow install guidance
    const dismissed = sessionStorage.getItem('rapiderp_pwa_dismissed');
    if (isIosDevice && !this.isStandalone() && !dismissed) {
      this.canInstall.set(true);
      this.showInstallBanner.set(true);
    }
  }

  private initInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.set(true);

      const dismissed = sessionStorage.getItem('rapiderp_pwa_dismissed');
      if (!this.isStandalone() && !dismissed) {
        this.showInstallBanner.set(true);
      }
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.showInstallBanner.set(false);
      this.isStandalone.set(true);
    });
  }

  async promptInstall(): Promise<void> {
    if (this.isIos()) {
      this.showIosInstructions.set(true);
      return;
    }

    if (this.deferredPrompt) {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        this.showInstallBanner.set(false);
      }
      this.deferredPrompt = null;
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      this.showIosInstructions.set(true);
    }
  }

  dismissBanner(): void {
    this.showInstallBanner.set(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('rapiderp_pwa_dismissed', 'true');
    }
  }

  closeIosInstructions(): void {
    this.showIosInstructions.set(false);
  }
}

