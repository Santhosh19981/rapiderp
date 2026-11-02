import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';

const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Electron') !== -1;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      ...(isElectron ? [withHashLocation()] : [])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !isElectron,
      // Register worker immediately after app is stable or after 30 seconds
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
