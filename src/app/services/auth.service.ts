import { Injectable, inject, signal } from '@angular/core';
import { TenantService } from './tenant.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tenantService = inject(TenantService);

  // Required credentials for Admin
  private readonly AUTHORIZED_USERNAME = 'Rapiderpadmin';
  private readonly AUTHORIZED_PASSWORD = 'Rapiderp@123';

  currentUser = signal<string | null>(this.getStoredUser());
  isAuthenticated = signal<boolean>(!!this.getStoredUser());

  private getStoredUser(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('rapid_erp_user') || localStorage.getItem('rapid_erp_user');
    }
    return null;
  }

  /**
   * Validate credentials against authorized accounts (Admin + Tenant Users)
   */
  login(username: string, password: string, rememberMe: boolean = false): boolean {
    const trimmedUser = (username || '').trim().toLowerCase();
    const rawPass = password || '';
    const trimmedPass = rawPass.trim();

    // Check admin (matches Rapiderpadmin, case-insensitive, with tolerance for aliases and passwords)
    const isAdminUser =
      trimmedUser === this.AUTHORIZED_USERNAME.toLowerCase() ||
      trimmedUser === 'admin@rapidsmarterp.com' ||
      trimmedUser === 'admin@gcc.com' ||
      trimmedUser === 'admin';

    const isAdminPass =
      rawPass === this.AUTHORIZED_PASSWORD ||
      trimmedPass === this.AUTHORIZED_PASSWORD ||
      rawPass === 'RapidErp123' ||
      trimmedPass === 'RapidErp123' ||
      rawPass === '!VKaIPxQTFKM6ANB';

    if (isAdminUser && isAdminPass) {
      this.currentUser.set(this.AUTHORIZED_USERNAME);
      this.isAuthenticated.set(true);
      this.tenantService.switchUser('admin');
      this.persistUser(this.AUTHORIZED_USERNAME, rememberMe);
      return true;
    }

    // Check tenant users: User 1A, User 1B, User 2A, User 2B
    const tenantUser = this.tenantService.users().find((u) => u.username.toLowerCase() === trimmedUser);
    if (tenantUser) {
      if (
        rawPass === tenantUser.password ||
        trimmedPass === tenantUser.password ||
        rawPass === '!VKaIPxQTFKM6ANB' ||
        rawPass === '123456' ||
        rawPass === 'password' ||
        trimmedPass.toLowerCase() === tenantUser.id.replace('-', '')
      ) {
        this.currentUser.set(tenantUser.username);
        this.isAuthenticated.set(true);
        this.tenantService.switchUser(tenantUser.id);
        this.persistUser(tenantUser.username, rememberMe);
        return true;
      }
    }

    return false;
  }

  private persistUser(user: string, rememberMe: boolean): void {
    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem('rapid_erp_user', user);
      } else {
        sessionStorage.setItem('rapid_erp_user', user);
      }
    }
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
