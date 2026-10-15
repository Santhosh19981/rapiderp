import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private router = inject(Router);
  private authService = inject(AuthService);

  username = signal<string>('');
  password = signal<string>('');
  rememberMe = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMsg = signal<string>('');

  onLogin(): void {
    this.errorMsg.set('');

    const u = this.username().trim();
    const p = this.password();

    if (!u || !p) {
      this.errorMsg.set('Please enter both username and password.');
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      const isValid = this.authService.login(u, p, this.rememberMe());
      this.isLoading.set(false);

      if (isValid) {
        this.router.navigate(['/landing']);
      } else {
        this.errorMsg.set('Invalid credentials. Access restricted to authorized accounts.');
      }
    }, 400);
  }

  toggleRememberMe(): void {
    this.rememberMe.update((v) => !v);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  forgotPassword(): void {
    alert('Please contact your administrator to reset credentials for admin@gcc.com.');
  }
}
