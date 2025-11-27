import { Routes } from '@angular/router';
import { Login } from './page/login/login';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', loadComponent: () => import('./page/registro/registro').then(m => m.Registro) },
  { path: 'panel', loadComponent: () => import('./page/panel/panel').then(m => m.Panel) },
  { path: 'panel/control', loadComponent: () => import('./page/control/control').then(m => m.Control) },
  { path: 'panel/control/gestor-administrativo', loadComponent: () => import('./page/gestor/gestor-administrativo/gestor-administrativo').then(m => m.GestorAdministrativo) },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];