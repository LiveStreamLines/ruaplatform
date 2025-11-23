import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';  // Import HttpClient
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { environment } from '../environment/environment';
import { 
  MSAL_INSTANCE, 
  MSAL_INTERCEPTOR_CONFIG, 
  MsalInterceptorConfiguration,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
  MsalService,
  MsalGuard,
  MsalBroadcastService
} from '@azure/msal-angular';
import { 
  IPublicClientApplication, 
  PublicClientApplication, 
  InteractionType,
  BrowserCacheLocation
} from '@azure/msal-browser';
import { AuthService } from './services/auth.service';
import { HeaderService } from './services/header.service';

// MSAL Instance Factory
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.msalConfig.auth.clientId,
      authority: environment.msalConfig.auth.authority,
      redirectUri: environment.msalConfig.auth.redirectUri,
      postLogoutRedirectUri: environment.msalConfig.auth.postLogoutRedirectUri
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage,
      storeAuthStateInCookie: environment.msalConfig.cache.storeAuthStateInCookie
    }
  });
}

// MSAL Interceptor Configuration
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  environment.protectedResourceMap.forEach((scopes, endpoint) => {
    protectedResourceMap.set(endpoint, scopes);
  });

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

// MSAL Guard Configuration
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['User.Read']
    }
  };
}

// APP_INITIALIZER to handle MSAL redirect BEFORE routing
export function initializeMSALRedirect(): () => Promise<void> {
  return async () => {
    console.log('[APP_INITIALIZER] ====== STARTING MSAL REDIRECT INIT ======');
    console.log('[APP_INITIALIZER] Current URL:', window.location.href);
    console.log('[APP_INITIALIZER] Hash:', window.location.hash);
    
    try {
      // Get MSAL instance from injector
      const msalInstance = inject(MSAL_INSTANCE) as unknown as IPublicClientApplication;
      const authService = inject(AuthService);
      const headerService = inject(HeaderService);
      const router = inject(Router);
      
      // Initialize MSAL
      console.log('[APP_INITIALIZER] Initializing MSAL...');
      await msalInstance.initialize();
      console.log('[APP_INITIALIZER] MSAL initialized');
      
      // Process redirect IMMEDIATELY while hash is still in URL
      console.log('[APP_INITIALIZER] Processing redirect with hash:', window.location.hash.substring(0, 100));
      const response = await msalInstance.handleRedirectPromise();
      console.log('[APP_INITIALIZER] handleRedirectPromise response:', response);
      
      if (response && response.account) {
        console.log('[APP_INITIALIZER] Redirect detected! Processing login for:', response.account.username);
        const email = response.account.username;
        const name = response.account.name;
        
        // Process SSO login
        return new Promise<void>((resolve) => {
          authService.ssoLogin(email, name).subscribe({
            next: (authResponse: any) => {
              console.log('[APP_INITIALIZER] SSO login successful');
              if (authResponse && authResponse.authh) {
                headerService.showHeaderAndSidenav = true;
                // Wait for token to be saved
                setTimeout(() => {
                  console.log('[APP_INITIALIZER] Navigating to /home');
                  router.navigate(['/home'], { replaceUrl: true }).then(() => {
                    resolve();
                  }).catch(() => {
                    window.location.href = '/home';
                    resolve();
                  });
                }, 200);
              } else {
                console.log('[APP_INITIALIZER] No auth token, will redirect to login');
                resolve();
              }
            },
            error: (error: any) => {
              console.error('[APP_INITIALIZER] SSO login error:', error);
              resolve(); // Continue app initialization even on error
            }
          });
        });
      } else {
        console.log('[APP_INITIALIZER] No redirect response');
      }
    } catch (error) {
      console.error('[APP_INITIALIZER] Error:', error);
    }
    
    console.log('[APP_INITIALIZER] ====== FINISHED MSAL REDIRECT INIT ======');
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(), 
    provideAnimationsAsync(),
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMSALRedirect,
      multi: true
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};
