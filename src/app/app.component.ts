import { Component, OnInit, Inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';  // Import CommonModule for ngFor and ngIf
import { HeaderComponent } from './components/header/header.component';  // Import HeaderComponent
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { MatSidenavModule } from '@angular/material/sidenav';  // Import Angular Material Sidenav
import { MatListModule } from '@angular/material/list';  // Import Angular Material List
import { HeaderService } from './services/header.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MSAL_INSTANCE } from '@azure/msal-angular';
import { IPublicClientApplication } from '@azure/msal-browser';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidenavComponent,
    MatSidenavModule,
    MatListModule,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  sidenavMode: 'side' | 'over' = 'side'; // Default to 'side' mode
  sidenavOpened: boolean = true; // Default to opened

  title = 'Rua Al Madina Timelapse';

  constructor(
    public headerService: HeaderService, 
    private breakpointObserver: BreakpointObserver,
    @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('[AppComponent] ========================================');
    console.log('[AppComponent] ngOnInit started');
    console.log('[AppComponent] Current URL:', window.location.href);
    console.log('[AppComponent] URL search params:', window.location.search);
    console.log('[AppComponent] URL hash:', window.location.hash);
    console.log('[AppComponent] Full URL object:', {
      href: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    });
    
    // CRITICAL: Check if we have a hash with code BEFORE initializing MSAL
    const hasCodeInHash = window.location.hash.includes('code=');
    console.log('[AppComponent] Has code in hash?', hasCodeInHash);
    
    // Initialize MSAL before using it
    // Initialize is idempotent, safe to call multiple times
    console.log('[AppComponent] Initializing MSAL...');
    try {
      await this.msalInstance.initialize();
      console.log('[AppComponent] MSAL initialized successfully');
      
      // Log MSAL configuration
      const config = (this.msalInstance as any).config;
      if (config) {
        console.log('[AppComponent] MSAL Config:', {
          clientId: config.auth?.clientId,
          authority: config.auth?.authority,
          redirectUri: config.auth?.redirectUri,
          postLogoutRedirectUri: config.auth?.postLogoutRedirectUri
        });
      }
    } catch (error) {
      console.error('[AppComponent] MSAL initialization error:', error);
    }

    // Handle MSAL redirect IMMEDIATELY after initialization (before any routing)
    console.log('[AppComponent] About to handle MSAL redirect...');
    console.log('[AppComponent] Hash before handleRedirectPromise:', window.location.hash);
    await this.handleMSALRedirect();
    console.log('[AppComponent] MSAL redirect handling completed');
    console.log('[AppComponent] Hash after handleRedirectPromise:', window.location.hash);

    this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.Tablet])
      .subscribe(result => {
        if (result.matches) {
          this.sidenavMode = 'over'; // Overlay mode for smaller screens
          this.sidenavOpened = false; // Closed by default on mobile
        } else {
          this.sidenavMode = 'side'; // Side mode for larger screens
          this.sidenavOpened = true; // Opened by default on desktop
        }
      });
  }

  // Handle MSAL redirect at app level - this ensures redirect is processed regardless of route
  private async handleMSALRedirect(): Promise<void> {
    try {
      console.log('[AppComponent] ====== STARTING MSAL REDIRECT HANDLING ======');
      console.log('[AppComponent] Current URL:', window.location.href);
      console.log('[AppComponent] Checking for MSAL redirect...');
      
      // Check if there are any accounts already
      const accountsBefore = this.msalInstance.getAllAccounts();
      console.log('[AppComponent] MSAL accounts before handleRedirectPromise:', accountsBefore.length);
      
      // Check URL for MSAL redirect indicators
      const urlParams = new URLSearchParams(window.location.search);
      const hashString = window.location.hash.substring(1); // Remove the #
      const hashParams = new URLSearchParams(hashString);
      
      // Convert URLSearchParams to object for logging
      const urlParamsObj: { [key: string]: string } = {};
      urlParams.forEach((value, key) => {
        urlParamsObj[key] = value;
      });
      
      const hashParamsObj: { [key: string]: string } = {};
      hashParams.forEach((value, key) => {
        hashParamsObj[key] = value;
      });
      
      console.log('[AppComponent] URL search params:', urlParamsObj);
      console.log('[AppComponent] URL hash params:', hashParamsObj);
      console.log('[AppComponent] Hash string length:', hashString.length);
      console.log('[AppComponent] Has code param?', urlParams.has('code') || hashParams.has('code'));
      console.log('[AppComponent] Has error param?', urlParams.has('error') || hashParams.has('error'));
      
      // CRITICAL: handleRedirectPromise must be called while the hash is still in the URL
      console.log('[AppComponent] Calling handleRedirectPromise NOW with hash:', window.location.hash.substring(0, 100) + '...');
      const response = await this.msalInstance.handleRedirectPromise();
      console.log('[AppComponent] handleRedirectPromise response:', response);
      console.log('[AppComponent] Response type:', typeof response);
      console.log('[AppComponent] Response is null?', response === null);
      console.log('[AppComponent] Response is undefined?', response === undefined);
      
      if (response) {
        console.log('[AppComponent] Response account:', response.account);
        console.log('[AppComponent] Response accessToken:', response.accessToken ? 'Present' : 'Missing');
      }
      
      // Check accounts after
      const accountsAfter = this.msalInstance.getAllAccounts();
      console.log('[AppComponent] MSAL accounts after handleRedirectPromise:', accountsAfter.length);
      
      if (response && response.account) {
        console.log('[AppComponent] MSAL redirect detected for:', response.account.username);
        // User just completed redirect login - process it
        const email = response.account.username;
        const name = response.account.name;
        
        // Process SSO login and wait for it to complete
        await new Promise<void>((resolve, reject) => {
          this.authService.ssoLogin(email, name).subscribe({
            next: (authResponse) => {
              console.log('[AppComponent] SSO login successful');
              if (authResponse && authResponse.authh) {
                // User is now logged in, navigate to home
                this.headerService.showHeaderAndSidenav = true;
                // Use setTimeout to ensure token is saved
                setTimeout(() => {
                  console.log('[AppComponent] Navigating to /home after successful login');
                  this.router.navigate(['/home'], { replaceUrl: true }).catch(() => {
                    // Fallback to window.location if router navigation fails
                    window.location.href = '/home';
                  });
                  resolve();
                }, 200);
              } else {
                console.error('[AppComponent] No auth token in response');
                this.router.navigate(['/login'], { replaceUrl: true });
                resolve();
              }
            },
            error: (error) => {
              console.error('[AppComponent] SSO login error:', error);
              // If login fails, redirect to login page
              this.router.navigate(['/login'], { replaceUrl: true });
              reject(error);
            }
          });
        });
      } else {
        console.log('[AppComponent] No redirect response from handleRedirectPromise');
        // No redirect response, check if user is authenticated via MSAL but not in our system
        const accounts = this.msalInstance.getAllAccounts();
        console.log('[AppComponent] Checking existing MSAL accounts:', accounts.length);
        console.log('[AppComponent] Is logged in to our system?', this.authService.isLoggedIn());
        
        if (accounts.length > 0 && !this.authService.isLoggedIn()) {
          console.log('[AppComponent] MSAL account found but not logged in to backend');
          const account = accounts[0];
          console.log('[AppComponent] Account details:', { username: account.username, name: account.name });
          if (account.username) {
            // Process login for existing MSAL account
            await new Promise<void>((resolve, reject) => {
              console.log('[AppComponent] Processing login for existing MSAL account...');
              this.authService.ssoLogin(account.username, account.name || undefined).subscribe({
                next: (authResponse) => {
                  console.log('[AppComponent] SSO login response for existing account:', authResponse);
                  if (authResponse && authResponse.authh) {
                    this.headerService.showHeaderAndSidenav = true;
                    setTimeout(() => {
                      console.log('[AppComponent] Navigating to /home for existing account');
                      this.router.navigate(['/home'], { replaceUrl: true }).catch(() => {
                        window.location.href = '/home';
                      });
                      resolve();
                    }, 200);
                  } else {
                    console.log('[AppComponent] No auth token in response for existing account');
                    resolve();
                  }
                },
                error: (error) => {
                  console.error('[AppComponent] SSO login error for existing account:', error);
                  this.router.navigate(['/login'], { replaceUrl: true });
                  reject(error);
                }
              });
            });
          }
        } else {
          console.log('[AppComponent] No MSAL accounts or user already logged in');
        }
      }
      console.log('[AppComponent] ====== FINISHED MSAL REDIRECT HANDLING ======');
    } catch (error) {
      console.error('[AppComponent] ====== ERROR IN MSAL REDIRECT HANDLING ======');
      console.error('[AppComponent] Error details:', error);
      console.error('[AppComponent] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    }
  }
}
