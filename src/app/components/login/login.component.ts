import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { HeaderService } from '../../services/header.service';
import { MsalService, MSAL_INSTANCE } from '@azure/msal-angular';
import { IPublicClientApplication } from '@azure/msal-browser';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, FormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginError: string | null = null;
  tempEmail: string = '';
  tempPassword: string = '';
  isSSOLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router, 
    private headerService: HeaderService,
    @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication,
    private msalService: MsalService
  ) {}

    async ngOnInit(): Promise<void> {
      this.headerService.showHeaderAndSidenav = false;

      // Ensure MSAL is initialized before using it
      // Initialize is idempotent, safe to call multiple times
      await this.msalInstance.initialize().catch(() => {
        // If already initialized, this will fail silently
      });

      // First, check if returning from SSO redirect (this must happen before checking isLoggedIn)
      const isProcessingRedirect = await this.handleSSORedirect();
      
      // If we're processing a redirect, don't check isLoggedIn yet (it will be set after SSO completes)
      if (isProcessingRedirect) {
        console.log('Processing redirect, waiting for login to complete...');
        return;
      }

      // Check if already logged in (only if not processing redirect)
      // Add a small delay to ensure any async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (this.authService.isLoggedIn()) {
        console.log('User is already logged in, redirecting to home...');
        this.router.navigate(['/home'], { replaceUrl: true });
        this.headerService.showHeaderAndSidenav = true;
        return;
      }
      
      console.log('User is not logged in, showing login page');
    }

  // Handle SSO redirect callback
  // Returns true if we're processing a redirect, false otherwise
  private async handleSSORedirect(): Promise<boolean> {
    try {
      console.log('Checking for SSO redirect...');
      // Handle redirect promise first
      const response = await this.msalInstance.handleRedirectPromise();
      console.log('handleRedirectPromise response:', response);
      
      if (response && response.account) {
        // User just completed redirect login
        console.log('SSO redirect detected, processing login for:', response.account.username);
        this.isSSOLoading = true;
        const email = response.account.username;
        const name = response.account.name;
        await this.processSSOLogin(email, name);
        return true;
      }

      // Check if user is already authenticated via MSAL but not in our system
      const accounts = this.msalInstance.getAllAccounts();
      console.log('MSAL accounts found:', accounts.length);
      console.log('Is logged in to our system:', this.authService.isLoggedIn());
      
      if (accounts.length > 0 && !this.authService.isLoggedIn()) {
        // User is authenticated via MSAL but not in our backend yet
        const account = accounts[0];
        console.log('MSAL account found but not logged in to backend, processing login for:', account.username);
        if (account.username) {
          this.isSSOLoading = true;
          await this.processSSOLogin(account.username, account.name || undefined);
          return true;
        }
      }
    } catch (error) {
      console.error('Error handling SSO redirect:', error);
      this.isSSOLoading = false;
      this.loginError = 'Error processing Microsoft login. Please try again.';
    }
    
    return false;
  }

  // SSO Login with Microsoft
  async onSSOLogin(): Promise<void> {
    this.loginError = null;
    this.isSSOLoading = true;

    try {
      // Ensure MSAL is initialized before using it
      // Initialize is idempotent, safe to call multiple times
      await this.msalInstance.initialize().catch(() => {
        // If already initialized, this will fail silently
      });

      const loginRequest = {
        scopes: ['User.Read'],
        prompt: 'select_account'
      };

      // Use redirect instead of popup for better compatibility
      this.msalService.loginRedirect(loginRequest).subscribe({
        next: () => {
          // Redirect will happen, so we don't need to do anything here
          // The handleSSORedirect() will be called when user returns
        },
        error: (error: any) => {
          console.error('SSO login error:', error);
          this.loginError = error.error?.message || error.message || 'SSO login failed. Please try again.';
          this.isSSOLoading = false;
        }
      });
    } catch (error: any) {
      console.error('SSO login error:', error);
      this.loginError = error.error?.message || error.message || 'SSO login failed. Please try again.';
      this.isSSOLoading = false;
    }
  }

  // Process SSO login - verify user against users list
  private async processSSOLogin(email: string, name?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Processing SSO login for:', email);
      this.authService.ssoLogin(email, name).subscribe({
        next: (response) => {
          console.log('SSO login response:', response);
          if (response && response.authh) {
            console.log('SSO login successful, auth token received');
            console.log('Auth token set:', !!this.authService.getAuthToken());
            console.log('Is logged in check:', this.authService.isLoggedIn());
            console.log('Navigating to /home...');
            
            // Ensure header is shown
            this.headerService.showHeaderAndSidenav = true;
            this.isSSOLoading = false;
            
            // Wait a moment to ensure token is fully saved to localStorage
            setTimeout(() => {
              // Verify token is saved before navigation
              const tokenSaved = !!localStorage.getItem('authToken');
              console.log('Token saved to localStorage:', tokenSaved);
              
              if (tokenSaved) {
                // Use window.location for a full page reload to ensure AuthGuard sees the token
                console.log('Using window.location for navigation...');
                window.location.href = '/home';
                resolve();
              } else {
                // If token not saved, try router navigation as fallback
                console.log('Token not saved yet, trying router navigation...');
                this.router.navigate(['/home'], { replaceUrl: true }).then((success) => {
                  console.log('Router navigation result:', success);
                  if (!success) {
                    window.location.href = '/home';
                  }
                  resolve();
                }).catch((err) => {
                  console.error('Navigation error:', err);
                  window.location.href = '/home';
                  resolve();
                });
              }
            }, 200);
          } else {
            console.error('SSO login failed: No auth token in response', response);
            this.loginError = 'Login failed. Please try again.';
            this.isSSOLoading = false;
            resolve();
          }
        },
        error: (error) => {
          console.error('SSO verification error:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          this.loginError = error.error?.msg || error.message || 'Access denied. Your account is not authorized.';
          this.isSSOLoading = false;
          // Logout from Microsoft if user is not in users list
          this.msalService.logoutPopup().subscribe({
            next: () => {
              console.log('Logged out from Microsoft');
            },
            error: (logoutError) => {
              console.error('MSAL logout error:', logoutError);
            }
          });
          reject(error);
        }
      });
    });
  }

  // ============================================
  // TEMP LOGIN - COMMENT OUT WHEN DONE
  // Bypasses Microsoft SSO, uses email/password
  // ============================================
  onTempLogin(): void {
    this.loginError = null;
    this.authService.tempLogin(this.tempEmail, this.tempPassword).subscribe({
      next: (response) => {
        if (response) {
          this.router.navigate(['/home']);
          this.headerService.showHeaderAndSidenav = true;
        }
      },
      error: (error) => {
        console.error('Temporary login error:', error);
        this.loginError = error.error?.msg || 'Login failed. Please try again.';
      }
    });
  }
  // ============================================
  // END TEMP LOGIN
  // ============================================
}