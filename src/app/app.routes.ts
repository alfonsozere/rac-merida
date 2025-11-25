import { Routes } from '@angular/router';
import { Login } from './page/login/login';
//import { LoginComponent } from './page/login/login.component';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'panel', loadComponent: () => import('./page/panel/panel').then(m => m.Panel) },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];