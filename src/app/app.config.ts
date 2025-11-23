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

// APP_INITIALIZER to check for stored redirect account and process login
export function initializeMSALRedirect(): () => Promise<void> {
  return async () => {
    console.log('[APP_INITIALIZER] ====== CHECKING FOR STORED REDIRECT ======');
    
    try {
      // Check if we have account info stored from main.ts
      const storedAccount = sessionStorage.getItem('msal_redirect_account');
      if (storedAccount) {
        console.log('[APP_INITIALIZER] Found stored account info');
        const accountInfo = JSON.parse(storedAccount);
        console.log('[APP_INITIALIZER] Account:', accountInfo);
        
        // Get services from injector
        const authService = inject(AuthService);
        const headerService = inject(HeaderService);
        const router = inject(Router);
        
        // Process SSO login
        return new Promise<void>((resolve) => {
          console.log('[APP_INITIALIZER] Processing SSO login for:', accountInfo.email);
          authService.ssoLogin(accountInfo.email, accountInfo.name).subscribe({
            next: (authResponse: any) => {
              console.log('[APP_INITIALIZER] SSO login successful');
              if (authResponse && authResponse.authh) {
                headerService.showHeaderAndSidenav = true;
                // Clear stored account
                sessionStorage.removeItem('msal_redirect_account');
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
                sessionStorage.removeItem('msal_redirect_account');
                resolve();
              }
            },
            error: (error: any) => {
              console.error('[APP_INITIALIZER] SSO login error:', error);
              sessionStorage.removeItem('msal_redirect_account');
              resolve(); // Continue app initialization even on error
            }
          });
        });
      } else {
        console.log('[APP_INITIALIZER] No stored account info');
      }
    } catch (error) {
      console.error('[APP_INITIALIZER] Error:', error);
    }
    
    console.log('[APP_INITIALIZER] ====== FINISHED CHECKING ======');
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
