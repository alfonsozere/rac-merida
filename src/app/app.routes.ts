import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { AuthGuard } from './core/guards/auth-guard';
import { ROLES } from './core/constants/constantes';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', loadComponent: () => import('./page/registro/registro').then(m => m.Registro) },
  { path: 'panel', loadComponent: () => import('./page/panel/panel').then(m => m.Panel), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_STATE,ROLES.ADMIN_MUNICIPAL,ROLES.ADMIN_CIRCUITAL,ROLES.ADMIN_SQUAD,ROLES.STANDARD]} },
  { path: 'panel/control', loadComponent: () => import('./page/control/control').then(m => m.Control), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_STATE,ROLES.ADMIN_MUNICIPAL,ROLES.ADMIN_CIRCUITAL,ROLES.ADMIN_SQUAD,ROLES.STANDARD]} },
  
  { path: 'panel/control/gestor-administrativo', loadComponent: () => import('./page/gestor/gestor-administrativo/gestor-administrativo').then(m => m.GestorAdministrativo), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.STANDARD]} },
  { path: 'panel/control/gestor-administrativo/empleados', loadComponent: () => import('./page/gestor/gestor-administrativo/empleado-administrativo/empleado-administrativo').then(m => m.EmpleadoAdministrativo), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.STANDARD]} },
  
  { path: 'panel/control/gestor-director', loadComponent: () => import('./page/gestor/gestor-director/gestor-director').then(m => m.GestorDirector), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_SQUAD]} },
  { path: 'panel/control/gestor-director/empleados', loadComponent: () => import('./page/gestor/gestor-director/empleado-director/empleado-director').then(m => m.EmpleadoDirector), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_SQUAD]} },
  { path: 'panel/control/gestor-director/usuarios', loadComponent: () => import('./page/gestor/gestor-director/usuario-director/usuario-director').then(m => m.UsuarioDirector), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_SQUAD]} },
  { path: 'panel/control/gestor-director/database', loadComponent: () => import('./page/gestor/gestor-director/database-director/database-director').then(m => m.DatabaseDirector), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_SQUAD]} },
  
  { path: 'panel/control/gestor-circuito', loadComponent: () => import('./page/gestor/gestor-circuito/gestor-circuito').then(m => m.GestorCircuito), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_CIRCUITAL]} },
  { path: 'panel/control/gestor-circuito/empleados', loadComponent: () => import('./page/gestor/gestor-circuito/empleado-circuito/empleado-circuito').then(m => m.EmpleadoCircuito), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_CIRCUITAL]} },
  { path: 'panel/control/gestor-circuito/usuarios', loadComponent: () => import('./page/gestor/gestor-circuito/usuario-circuito/usuario-circuito').then(m => m.UsuarioCircuito), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_CIRCUITAL]} },
  { path: 'panel/control/gestor-circuito/database', loadComponent: () => import('./page/gestor/gestor-circuito/database-circuito/database-circuito').then(m => m.DatabaseCircuito), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_CIRCUITAL]} },
  
  { path: 'panel/control/gestor-municipio', loadComponent: () => import('./page/gestor/gestor-municipio/gestor-municipio').then(m => m.GestorMunicipio), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_MUNICIPAL]} },
  { path: 'panel/control/gestor-municipio/empleados', loadComponent: () => import('./page/gestor/gestor-municipio/empleado-municipio/empleado-municipio').then(m => m.EmpleadoMunicipio), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_MUNICIPAL]} },
  { path: 'panel/control/gestor-municipio/usuarios', loadComponent: () => import('./page/gestor/gestor-municipio/usuario-municipio/usuario-municipio').then(m => m.UsuarioMunicipio), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_MUNICIPAL]} },
  { path: 'panel/control/gestor-municipio/database', loadComponent: () => import('./page/gestor/gestor-municipio/database-municipio/database-municipio').then(m => m.DatabaseMunicipio), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_MUNICIPAL]} },
  
  { path: 'panel/control/gestor-estado', loadComponent: () => import('./page/gestor/gestor-estado/gestor-estado').then(m => m.GestorEstado), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_STATE]} },
  { path: 'panel/control/gestor-estado/empleados', loadComponent: () => import('./page/gestor/gestor-estado/empleado-estado/empleado-estado').then(m => m.EmpleadoEstado), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_STATE]} },
  { path: 'panel/control/gestor-estado/usuarios', loadComponent: () => import('./page/gestor/gestor-estado/usuario-estado/usuario-estado').then(m => m.UsuarioEstado), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_STATE]} },
  { path: 'panel/control/gestor-estado/database', loadComponent: () => import('./page/gestor/gestor-estado/database-estado/database-estado').then(m => m.DatabaseEstado), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_STATE]} },
  
  { path: 'panel/control/gestor-web', loadComponent: () => import('./page/gestor/gestor-web/gestor-web').then(m => m.GestorWeb), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN]} },
  { path: 'panel/control/gestor-web/empleados', loadComponent: () => import('./page/gestor/gestor-web/empleado-web/empleado-web').then(m => m.EmpleadoWeb), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN]} },
  { path: 'panel/control/gestor-web/usuarios', loadComponent: () => import('./page/gestor/gestor-web/usuario-web/usuario-web').then(m => m.UsuarioWeb), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN]} },
  { path: 'panel/control/gestor-web/database', loadComponent: () => import('./page/gestor/gestor-web/database-web/database-web').then(m => m.DatabaseWeb), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN]} },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];