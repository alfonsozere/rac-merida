import { Routes } from '@angular/router';
import { Login } from './page/login/login';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', loadComponent: () => import('./page/registro/registro').then(m => m.Registro) },
  { path: 'panel', loadComponent: () => import('./page/panel/panel').then(m => m.Panel) },
  { path: 'panel/control', loadComponent: () => import('./page/control/control').then(m => m.Control) },
  
  { path: 'panel/control/gestor-administrativo', loadComponent: () => import('./page/gestor/gestor-administrativo/gestor-administrativo').then(m => m.GestorAdministrativo) },
  { path: 'panel/control/gestor-administrativo/empleados', loadComponent: () => import('./page/gestor/gestor-administrativo/empleado-administrativo/empleado-administrativo').then(m => m.EmpleadoAdministrativo) },
  
  { path: 'panel/control/gestor-director', loadComponent: () => import('./page/gestor/gestor-director/gestor-director').then(m => m.GestorDirector) },
  { path: 'panel/control/gestor-director/empleados', loadComponent: () => import('./page/gestor/gestor-director/empleado-director/empleado-director').then(m => m.EmpleadoDirector) },
  { path: 'panel/control/gestor-director/usuarios', loadComponent: () => import('./page/gestor/gestor-director/usuario-director/usuario-director').then(m => m.UsuarioDirector) },
  { path: 'panel/control/gestor-director/database', loadComponent: () => import('./page/gestor/gestor-director/database-director/database-director').then(m => m.DatabaseDirector) },
  
  { path: 'panel/control/gestor-circuito', loadComponent: () => import('./page/gestor/gestor-circuito/gestor-circuito').then(m => m.GestorCircuito) },
  { path: 'panel/control/gestor-circuito/empleados', loadComponent: () => import('./page/gestor/gestor-circuito/empleado-circuito/empleado-circuito').then(m => m.EmpleadoCircuito) },
  { path: 'panel/control/gestor-circuito/usuarios', loadComponent: () => import('./page/gestor/gestor-circuito/usuario-circuito/usuario-circuito').then(m => m.UsuarioCircuito) },
  { path: 'panel/control/gestor-circuito/database', loadComponent: () => import('./page/gestor/gestor-circuito/database-circuito/database-circuito').then(m => m.DatabaseCircuito) },
  
  { path: 'panel/control/gestor-municipio', loadComponent: () => import('./page/gestor/gestor-municipio/gestor-municipio').then(m => m.GestorMunicipio) },
  { path: 'panel/control/gestor-municipio/empleados', loadComponent: () => import('./page/gestor/gestor-municipio/empleado-municipio/empleado-municipio').then(m => m.EmpleadoMunicipio) },
  { path: 'panel/control/gestor-municipio/usuarios', loadComponent: () => import('./page/gestor/gestor-municipio/usuario-municipio/usuario-municipio').then(m => m.UsuarioMunicipio) },
  { path: 'panel/control/gestor-municipio/database', loadComponent: () => import('./page/gestor/gestor-municipio/database-municipio/database-municipio').then(m => m.DatabaseMunicipio) },
  
  { path: 'panel/control/gestor-estado', loadComponent: () => import('./page/gestor/gestor-estado/gestor-estado').then(m => m.GestorEstado) },
  { path: 'panel/control/gestor-estado/empleados', loadComponent: () => import('./page/gestor/gestor-estado/empleado-estado/empleado-estado').then(m => m.EmpleadoEstado) },
  { path: 'panel/control/gestor-estado/usuarios', loadComponent: () => import('./page/gestor/gestor-estado/usuario-estado/usuario-estado').then(m => m.UsuarioEstado) },
  { path: 'panel/control/gestor-estado/database', loadComponent: () => import('./page/gestor/gestor-estado/database-estado/database-estado').then(m => m.DatabaseEstado) },
  
  { path: 'panel/control/gestor-web', loadComponent: () => import('./page/gestor/gestor-web/gestor-web').then(m => m.GestorWeb) },
  { path: 'panel/control/gestor-web/empleados', loadComponent: () => import('./page/gestor/gestor-web/empleado-web/empleado-web').then(m => m.EmpleadoWeb) },
  { path: 'panel/control/gestor-web/usuarios', loadComponent: () => import('./page/gestor/gestor-web/usuario-web/usuario-web').then(m => m.UsuarioWeb) },
  { path: 'panel/control/gestor-web/database', loadComponent: () => import('./page/gestor/gestor-web/database-web/database-web').then(m => m.DatabaseWeb) },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];