import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';  // Import CommonModule for ngFor and ngIf
import { HeaderComponent } from './components/header/header.component';  // Import HeaderComponent
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { MatSidenavModule } from '@angular/material/sidenav';  // Import Angular Material Sidenav
import { MatListModule } from '@angular/material/list';  // Import Angular Material List
import { HeaderService } from './services/header.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MsalService } from '@azure/msal-angular';
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

  title = 'AHC Timelapse';

  constructor(
    public headerService: HeaderService, 
    private breakpointObserver: BreakpointObserver,
    private msalService: MsalService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Initialize Microsoft authentication
    this.msalService.handleRedirectObservable().subscribe({
      next: (result: any) => {
        if (result) {
          // Handle successful Microsoft login
          this.authService.handleMicrosoftLogin().subscribe({
            next: (isLoggedIn) => {
              if (isLoggedIn) {
                // Redirect to home page after successful Microsoft login
                window.location.href = '/home';
              }
            }
          });
        }
      },
      error: (error: any) => {
        console.error('Microsoft authentication error:', error);
      }
    });

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
}
