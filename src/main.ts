import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environment/environment';
import { PublicClientApplication, IPublicClientApplication, BrowserCacheLocation } from '@azure/msal-browser';

// Handle MSAL redirect BEFORE Angular bootstraps
async function handleMSALRedirectBeforeBootstrap(): Promise<void> {
  console.log('[MAIN.TS] ====== HANDLING MSAL REDIRECT BEFORE BOOTSTRAP ======');
  console.log('[MAIN.TS] Current URL:', window.location.href);
  console.log('[MAIN.TS] Hash:', window.location.hash);
  
  // Check if we have a redirect code in the hash
  const hasCode = window.location.hash.includes('code=');
  console.log('[MAIN.TS] Has code in hash?', hasCode);
  
  if (!hasCode) {
    console.log('[MAIN.TS] No redirect code found, proceeding with normal bootstrap');
    return;
  }
  
  try {
    // Create MSAL instance directly (before Angular)
    const msalInstance: IPublicClientApplication = new PublicClientApplication({
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
    
    console.log('[MAIN.TS] Initializing MSAL...');
    await msalInstance.initialize();
    console.log('[MAIN.TS] MSAL initialized');
    
    // Process redirect while hash is still in URL
    console.log('[MAIN.TS] Processing redirect with hash:', window.location.hash.substring(0, 100));
    const response = await msalInstance.handleRedirectPromise();
    console.log('[MAIN.TS] handleRedirectPromise response:', response);
    
    if (response && response.account) {
      console.log('[MAIN.TS] Redirect detected! Account:', response.account.username);
      // Store account info in sessionStorage for app component to use
      sessionStorage.setItem('msal_redirect_account', JSON.stringify({
        email: response.account.username,
        name: response.account.name
      }));
      console.log('[MAIN.TS] Account info stored in sessionStorage');
    } else {
      console.log('[MAIN.TS] No redirect response');
    }
  } catch (error) {
    console.error('[MAIN.TS] Error handling redirect:', error);
  }
  
  console.log('[MAIN.TS] ====== FINISHED MSAL REDIRECT HANDLING ======');
}

// Handle redirect before bootstrapping
handleMSALRedirectBeforeBootstrap()
  .then(() => {
    console.log('[MAIN.TS] Bootstrapping Angular application...');
    bootstrapApplication(AppComponent, appConfig)
      .catch((err) => console.error(err));
  })
  .catch((err) => {
    console.error('[MAIN.TS] Error in redirect handling, bootstrapping anyway:', err);
    bootstrapApplication(AppComponent, appConfig)
      .catch((err) => console.error(err));
  });
