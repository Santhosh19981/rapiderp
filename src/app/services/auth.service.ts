import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Required credentials
  private readonly AUTHORIZED_USERNAME = 'admin@gcc.com';
  private readonly AUTHORIZED_PASSWORD = '!VKaIPxQTFKM6ANB';

  currentUser = signal<string | null>(this.getStoredUser());
  isAuthenticated = signal<boolean>(!!this.getStoredUser());

  private getStoredUser(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('rapid_erp_user') || localStorage.getItem('rapid_erp_user');
    }
    return null;
  }

  /**
   * Validate credentials against authorized account
   * Restricts login if any other inputs are used
   */
  login(username: string, password: string, rememberMe: boolean = false): boolean {
    const trimmedUser = (username || '').trim();
    const providedPass = password || '';

    if (trimmedUser === this.AUTHORIZED_USERNAME && providedPass === this.AUTHORIZED_PASSWORD) {
      this.currentUser.set(trimmedUser);
      this.isAuthenticated.set(true);

      if (typeof window !== 'undefined') {
        if (rememberMe) {
          localStorage.setItem('rapid_erp_user', trimmedUser);
        } else {
          sessionStorage.setItem('rapid_erp_user', trimmedUser);
        }
      }
      return true;
    }

    return false;
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('rapid_erp_user');
      localStorage.removeItem('rapid_erp_user');
    }
  }
}
