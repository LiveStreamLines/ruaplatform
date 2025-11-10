import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';  // Import HttpClient
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MsalService, MsalGuard, MsalBroadcastService, MsalInterceptor, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG } from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { environment } from '../environment/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(), 
    provideAnimationsAsync(),
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    {
      provide: MSAL_INSTANCE,
      useFactory: () => new PublicClientApplication({
        auth: environment.msalConfig.auth,
        cache: environment.msalConfig.cache,
        system: environment.msalConfig.system
      })
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useValue: {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: environment.protectedResourceMap
      }
    },
    MsalInterceptor
  ]
};
