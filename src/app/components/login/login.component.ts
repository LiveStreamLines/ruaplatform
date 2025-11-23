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
      console.log('[LoginComponent] ====== LOGIN COMPONENT INIT ======');
      console.log('[LoginComponent] Current URL:', window.location.href);
      console.log('[LoginComponent] URL search:', window.location.search);
      console.log('[LoginComponent] URL hash:', window.location.hash);
      
      this.headerService.showHeaderAndSidenav = false;
      
      // Check for error message from SSO login attempt
      const ssoError = sessionStorage.getItem('ssoLoginError');
      if (ssoError) {
        this.loginError = ssoError;
        sessionStorage.removeItem('ssoLoginError');
        console.log('[LoginComponent] Displaying SSO error:', ssoError);
      }

      // Ensure MSAL is initialized before using it
      // Initialize is idempotent, safe to call multiple times
      console.log('[LoginComponent] Initializing MSAL...');
      try {
        await this.msalInstance.initialize();
        console.log('[LoginComponent] MSAL initialized');
      } catch (error) {
        console.error('[LoginComponent] MSAL init error:', error);
      }

      // Note: MSAL redirect is handled at app level (app.component.ts)
      // This is a fallback check in case redirect wasn't handled yet
      console.log('[LoginComponent] Checking for redirect (fallback)...');
      const isProcessingRedirect = await this.handleSSORedirect();
      console.log('[LoginComponent] Is processing redirect?', isProcessingRedirect);
      
      // If we're processing a redirect, don't check isLoggedIn yet (it will be set after SSO completes)
      if (isProcessingRedirect) {
        console.log('[LoginComponent] Processing redirect, waiting for login to complete...');
        return;
      }

      // Check if already logged in (only if not processing redirect)
      // Add a small delay to ensure any async operations complete
      console.log('[LoginComponent] Waiting 200ms before checking login status...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const isLoggedIn = this.authService.isLoggedIn();
      const authToken = this.authService.getAuthToken();
      const localStorageToken = localStorage.getItem('authToken');
      
      console.log('[LoginComponent] Login check results:');
      console.log('[LoginComponent] - isLoggedIn():', isLoggedIn);
      console.log('[LoginComponent] - getAuthToken():', authToken);
      console.log('[LoginComponent] - localStorage token:', localStorageToken);
      
      if (isLoggedIn) {
        console.log('[LoginComponent] User is already logged in, redirecting to home...');
        this.router.navigate(['/home'], { replaceUrl: true });
        this.headerService.showHeaderAndSidenav = true;
        return;
      }
      
      console.log('[LoginComponent] User is not logged in, showing login page');
      console.log('[LoginComponent] ====== LOGIN COMPONENT INIT COMPLETE ======');
    }

  // Handle SSO redirect callback (fallback - main handling is in app.component.ts)
  // Returns true if we're processing a redirect, false otherwise
  private async handleSSORedirect(): Promise<boolean> {
    try {
      console.log('[LoginComponent] Checking for SSO redirect (fallback)...');
      // Handle redirect promise first (may return null if already handled by app component)
      const response = await this.msalInstance.handleRedirectPromise();
      console.log('[LoginComponent] handleRedirectPromise response:', response);
      
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
          
          // Extract error message from backend response
          let errorMessage = 'Access denied. Your account is not authorized.';
          if (error.error) {
            if (typeof error.error === 'string') {
              try {
                const parsed = JSON.parse(error.error);
                errorMessage = parsed.msg || errorMessage;
              } catch {
                errorMessage = error.error;
              }
            } else if (error.error.msg) {
              errorMessage = error.error.msg;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          console.error('Displaying error message:', errorMessage);
          this.loginError = errorMessage;
          this.isSSOLoading = false;
          
          // Logout from Microsoft if user is not in users list
          // Use logoutRedirect instead of logoutPopup to avoid popup blocking issues
          this.msalService.logoutRedirect().subscribe({
            next: () => {
              console.log('Redirecting to logout from Microsoft');
            },
            error: (logoutError) => {
              console.error('MSAL logout error:', logoutError);
              // If logout fails, at least clear local state
              this.msalInstance.clearCache();
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