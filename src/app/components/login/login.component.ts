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

    ngOnInit(): void {
      this.headerService.showHeaderAndSidenav = false;

      // Check if already logged in
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/home']);
        this.headerService.showHeaderAndSidenav = true;
        return;
      }

      // Check if returning from SSO redirect
      this.handleSSORedirect();
    }

  // Handle SSO redirect callback
  private async handleSSORedirect(): Promise<void> {
    try {
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        // User is already authenticated via SSO, get account info
        const account = accounts[0];
        if (account.username) {
          await this.processSSOLogin(account.username, account.name || undefined);
        }
      }
    } catch (error) {
      console.error('Error handling SSO redirect:', error);
    }
  }

  // SSO Login with Microsoft
  async onSSOLogin(): Promise<void> {
    this.loginError = null;
    this.isSSOLoading = true;

    try {
      const loginRequest = {
        scopes: ['User.Read'],
        prompt: 'select_account'
      };

      this.msalService.loginPopup(loginRequest).subscribe({
        next: (response) => {
          if (response && response.account) {
            const email = response.account.username;
            const name = response.account.name;
            this.processSSOLogin(email, name);
          }
        },
        error: (error: any) => {
          console.error('SSO login error:', error);
          this.loginError = error.error?.message || 'SSO login failed. Please try again.';
          this.isSSOLoading = false;
        }
      });
    } catch (error: any) {
      console.error('SSO login error:', error);
      this.loginError = error.error?.message || 'SSO login failed. Please try again.';
      this.isSSOLoading = false;
    }
  }

  // Process SSO login - verify user against users list
  private processSSOLogin(email: string, name?: string): void {
    this.authService.ssoLogin(email, name).subscribe({
      next: (response) => {
        if (response && response.authh) {
          this.router.navigate(['/home']);
          this.headerService.showHeaderAndSidenav = true;
          this.isSSOLoading = false;
        }
      },
      error: (error) => {
        console.error('SSO verification error:', error);
        this.loginError = error.error?.msg || 'Access denied. Your account is not authorized.';
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
      }
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