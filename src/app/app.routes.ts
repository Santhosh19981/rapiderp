import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Landing } from './components/landing/landing';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'landing', component: Landing, canActivate: [authGuard] },
  { path: 'landing/:moduleId', component: Landing, canActivate: [authGuard] },
  { path: 'landing/:moduleId/:subModuleId', component: Landing, canActivate: [authGuard] },
  { path: 'dashboard', redirectTo: 'landing/dashboard', pathMatch: 'full' },
  { path: 'countries', redirectTo: 'landing/countries', pathMatch: 'full' },
  { path: 'country', redirectTo: 'landing/countries', pathMatch: 'full' },
  { path: 'audit-history', redirectTo: 'landing/audit-history', pathMatch: 'full' },
  { path: 'audit', redirectTo: 'landing/audit-history', pathMatch: 'full' },
  { path: ':moduleId', redirectTo: 'landing/:moduleId', pathMatch: 'full' },
  { path: ':moduleId/:subModuleId', redirectTo: 'landing/:moduleId/:subModuleId', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
