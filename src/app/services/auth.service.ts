import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

// Define a consistent interface for the backend login response
interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  phone: string;
  authh: string;
  role: string;
  phoneRequired: string;
  accessibleDevelopers: string[];
  accessibleProjects: string[];
  accessibleCameras: string[];
  accessibleServices: string[];
  canAddUser: string;
  canGenerateVideoAndPics: string;
  manual: string;
  memoryRole: string;
  inventoryRole: string;
  LastLoginTime: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.backend + '/api';

  // Subjects for reactive updates
  private userRoleSubject = new BehaviorSubject<string | null>(null);
  private canAddUserSubject = new BehaviorSubject<boolean | null>(null);
  private inventoryRoleSubject = new BehaviorSubject<string | null>(null);
  private memoryRoleSubject = new BehaviorSubject<string | null>(null);

  // Observables exposed
  userRole$ = this.userRoleSubject.asObservable();
  canAddUser$ = this.canAddUserSubject.asObservable().pipe(
    tap((perm) => console.log('canAddUser$ emitted:', perm))
  );
  inventoryRole$ = this.inventoryRoleSubject.asObservable();
  memoryRole$ = this.memoryRoleSubject.asObservable();

  // User state
  private authToken: string | null = null;
  private userId: string | null = null;
  private username: string | null = null;
  private useremail: string | null = null;
  private phone: string | null = null;
  private userRole: string | null = null;
  private canAddUser: string | null = null;
  private canGenerateVideoAndPics: string | null = null;
  private manual: string | null = null;
  private memoryRole: string | null = null;
  private inventoryRole: string | null = null;
  private LastLoginTime: string | null = null;

  private accessibleDevelopers: string[] = [];
  private accessibleProjects: string[] = [];
  private accessibleCameras: string[] = [];
  private accessibleServices: string[] = [];

  constructor(private http: HttpClient, private router: Router) {
    // Initialize from localStorage
    this.authToken = localStorage.getItem('authToken');
    this.userId = localStorage.getItem('userId');
    this.username = localStorage.getItem('username');
    this.useremail = localStorage.getItem('useremail');
    this.phone = localStorage.getItem('phone');
    this.userRole = localStorage.getItem('userRole');
    this.canAddUser = localStorage.getItem('canAddUser');
    this.canGenerateVideoAndPics = localStorage.getItem('canGenerateVideoAndPics');
    this.manual = localStorage.getItem('manual');
    this.memoryRole = localStorage.getItem('memoryRole');
    this.inventoryRole = localStorage.getItem('inventoryRole');

    this.accessibleDevelopers = JSON.parse(localStorage.getItem('accessibleDevelopers') || '[]');
    this.accessibleProjects = JSON.parse(localStorage.getItem('accessibleProjects') || '[]');
    this.accessibleCameras = JSON.parse(localStorage.getItem('accessibleCameras') || '[]');
    this.accessibleServices = JSON.parse(localStorage.getItem('accessibleServices') || '[]');

    // Notify subscribers
    this.userRoleSubject.next(this.userRole);
    this.canAddUserSubject.next(this.canAddUser === 'true');
    this.inventoryRoleSubject.next(this.inventoryRole);
    this.memoryRoleSubject.next(this.memoryRole);
  }


  // Temporary login method for testing (bypasses Microsoft)
  tempLogin(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response) => {
        if (response && !response.phoneRequired) {
          this.setUserData(response);
        }
      })
    );
  }

  // SSO Login - Authenticate via Microsoft SSO and verify against users list
  ssoLogin(email: string, name?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/sso-login`, { email, name }).pipe(
      tap((response) => {
        if (response && response.authh) {
          this.setUserData(response);
        }
      })
    );
  }



  logout(): void {
    // Clear local data
    this.authToken = null;
    this.userId = null;
    this.username = null;
    this.useremail = null;
    this.phone = null;
    this.userRole = null;
    this.canAddUser = null;
    this.canGenerateVideoAndPics = null;
    this.manual = null;
    this.memoryRole = null;
    this.inventoryRole = null;
    this.accessibleDevelopers = [];
    this.accessibleProjects = [];
    this.accessibleCameras = [];
    this.accessibleServices = [];

    localStorage.clear();
    this.userRoleSubject.next(null);
    this.canAddUserSubject.next(null);
    this.inventoryRoleSubject.next(null);
    this.memoryRoleSubject.next(null);
  }

  private setUserData(response: AuthResponse): void {
    // Add detailed logging of the response
    console.log('Auth Response:', response);
    console.log('All response keys:', Object.keys(response));
    console.log('Inventory role related fields:', {
      inventoryRole: response.inventoryRole,
      rawResponse: response
    });

    this.userId = response._id;
    this.username = response.name;
    this.useremail = response.email;
    this.phone = response.phone;
    this.authToken = response.authh;
    this.userRole = response.role;
    this.accessibleDevelopers = response.accessibleDevelopers || [];
    this.accessibleProjects = response.accessibleProjects || [];
    this.accessibleCameras = response.accessibleCameras || [];
    this.accessibleServices = response.accessibleServices || [];
    this.canAddUser = response.canAddUser;
    this.canGenerateVideoAndPics = response.canGenerateVideoAndPics;
    this.manual = response.manual;
    this.memoryRole = response.memoryRole;
    this.inventoryRole = response.inventoryRole || null;
    this.LastLoginTime = response.LastLoginTime;

    // Log the final inventory role value
    console.log('Final inventory role value:', this.inventoryRole);

    // Emit to subscribers
    this.userRoleSubject.next(this.userRole);
    const check = this.canAddUser.toString();
    this.canAddUserSubject.next(check === 'true');
    this.inventoryRoleSubject.next(this.inventoryRole);
    this.memoryRoleSubject.next(this.memoryRole);

    // Save to localStorage
    localStorage.setItem('userId', this.userId);
    localStorage.setItem('username', this.username);
    localStorage.setItem('useremail', this.useremail);
    localStorage.setItem('phone', this.phone);
    localStorage.setItem('authToken', this.authToken);
    localStorage.setItem('userRole', this.userRole);
    localStorage.setItem('accessibleDevelopers', JSON.stringify(this.accessibleDevelopers));
    localStorage.setItem('accessibleProjects', JSON.stringify(this.accessibleProjects));
    localStorage.setItem('accessibleCameras', JSON.stringify(this.accessibleCameras));
    localStorage.setItem('accessibleServices', JSON.stringify(this.accessibleServices));
    localStorage.setItem('canAddUser', this.canAddUser);
    localStorage.setItem('canGenerateVideoAndPics', this.canGenerateVideoAndPics);
    localStorage.setItem('manual', this.manual);
    localStorage.setItem('memoryRole', this.memoryRole);
    localStorage.setItem('inventoryRole', this.inventoryRole || '');
  }

  // Public getters
  getUserId(): string | null {
    return this.userId;
  }

  getlastlogintime(): string | null {
     return this.LastLoginTime;
  }

  getManual(): string | null {
    return this.manual;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  getUsername(): string | null {
    return this.username;
  }

  getUserRole(): string | null {
    return this.userRole;
  }

  getAccessibleDevelopers(): string[] {
    return this.accessibleDevelopers;
  }

  getAccessibleProjects(): string[] {
    return this.accessibleProjects;
  }

  getAccessibleServices(): string[] {
    return this.accessibleServices;
  }

  getAccessibleCameras(): string[] {
    return this.accessibleCameras;
  }

  getCanGenerateVideoAndPics(): string | null {
    return this.canGenerateVideoAndPics;
  }

  getMemoryRole(): string | null {
    return this.memoryRole;
  }

  getInventoryRole(): string | null {
    return this.inventoryRole;
  }

  isLoggedIn(): boolean {
    // Check authentication
    return !!this.authToken || !!localStorage.getItem('authToken');
  }
}
