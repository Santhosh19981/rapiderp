import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Landing } from './components/landing/landing';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'landing', component: Landing, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];
