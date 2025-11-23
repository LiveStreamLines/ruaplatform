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
    // Initialize MSAL before using it
    // Initialize is idempotent, safe to call multiple times
    await this.msalInstance.initialize().catch(() => {
      // If already initialized, this will fail silently
    });

    // Handle MSAL redirect at app level (before routing)
    await this.handleMSALRedirect();

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
      console.log('[AppComponent] Checking for MSAL redirect...');
      const response = await this.msalInstance.handleRedirectPromise();
      console.log('[AppComponent] handleRedirectPromise response:', response);
      
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
        // No redirect response, check if user is authenticated via MSAL but not in our system
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length > 0 && !this.authService.isLoggedIn()) {
          console.log('[AppComponent] MSAL account found but not logged in to backend');
          const account = accounts[0];
          if (account.username) {
            // Process login for existing MSAL account
            await new Promise<void>((resolve, reject) => {
              this.authService.ssoLogin(account.username, account.name || undefined).subscribe({
                next: (authResponse) => {
                  if (authResponse && authResponse.authh) {
                    this.headerService.showHeaderAndSidenav = true;
                    setTimeout(() => {
                      this.router.navigate(['/home'], { replaceUrl: true }).catch(() => {
                        window.location.href = '/home';
                      });
                      resolve();
                    }, 200);
                  } else {
                    resolve();
                  }
                },
                error: (error) => {
                  console.error('[AppComponent] SSO login error:', error);
                  this.router.navigate(['/login'], { replaceUrl: true });
                  reject(error);
                }
              });
            });
          }
        }
      }
    } catch (error) {
      console.error('[AppComponent] Error handling MSAL redirect:', error);
    }
  }
}
