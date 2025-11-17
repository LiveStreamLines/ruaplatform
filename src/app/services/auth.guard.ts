import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check authentication
    const isLoggedIn = this.authService.isLoggedIn();
    
    // If trying to access login page, allow it
    if (state.url === '/login') {
      return true;
    }
    
    if (!isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }
  
    // Check if route is restricted by role
    const requiredRoles = route.data['roles'] as Array<string>;
    if (requiredRoles) {
      const userRole = this.authService.getUserRole();
      if (!userRole || !requiredRoles.includes(userRole)) {
        // Role not authorized, redirect to home page
        this.router.navigate(['/home']);
        return false;
      }
    }

    return true;
  }


}
