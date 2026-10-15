import { Component, computed, inject, signal } from '@angular/core';
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

  usernameFocused = signal<boolean>(false);
  passwordFocused = signal<boolean>(false);

  usernameError = signal<string>('');
  passwordError = signal<string>('');
  isListening = signal<boolean>(false);

  // Floating label triggers (matches reference UI notch)
  isUsernameFloating = computed(() => {
    return this.usernameFocused() || this.username().trim().length > 0;
  });

  isPasswordFloating = computed(() => {
    return this.passwordFocused() || this.password().length > 0;
  });

  // Valid tick mark triggers (shows green tick mark as user types valid content)
  isUsernameValid = computed(() => {
    const u = this.username().trim();
    return u.length >= 2;
  });

  isPasswordValid = computed(() => {
    const p = this.password();
    return p.length >= 3;
  });

  onUsernameInput(val: string): void {
    this.username.set(val);
    if (this.usernameError()) {
      this.usernameError.set('');
    }
  }

  onPasswordInput(val: string): void {
    this.password.set(val);
    if (this.passwordError()) {
      this.passwordError.set('');
    }
  }

  onLogin(): void {
    this.usernameError.set('');
    this.passwordError.set('');

    const u = this.username().trim();
    const p = this.password();

    let hasError = false;

    if (!u) {
      this.usernameError.set('Please enter your username or email.');
      hasError = true;
    }

    if (!p) {
      this.passwordError.set('Please enter your password.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      const isValid = this.authService.login(u, p, this.rememberMe());
      this.isLoading.set(false);

      if (isValid) {
        this.router.navigate(['/landing']);
      } else {
        if (u !== 'admin@gcc.com') {
          this.usernameError.set('Invalid username. Access restricted to authorized accounts.');
        }
        if (p !== '!VKaIPxQTFKM6ANB') {
          this.passwordError.set('Invalid password. Please check your credentials.');
        }
      }
    }, 400);
  }

  toggleRememberMe(): void {
    this.rememberMe.update((v) => !v);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  startSpeechRecognition(): void {
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Demo helper fallback if browser doesn't have Web Speech API enabled
      this.username.set('admin@gcc.com');
      this.usernameError.set('');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      this.isListening.set(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript || '';
        const clean = transcript.replace(/\s+/g, '').toLowerCase();
        this.username.set(clean.includes('admin') ? 'admin@gcc.com' : clean);
        this.usernameError.set('');
        this.isListening.set(false);
      };

      recognition.onerror = () => {
        this.isListening.set(false);
      };

      recognition.onend = () => {
        this.isListening.set(false);
      };

      recognition.start();
    } catch {
      this.isListening.set(false);
    }
  }

  forgotPassword(): void {
    alert('Please contact your administrator to reset credentials for admin@gcc.com.');
  }
}

