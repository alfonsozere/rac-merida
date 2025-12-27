import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { AuthGuard } from './core/guards/auth-guard';
import { ROLES } from './core/constants/constantes';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', loadComponent: () => import('./page/registro/registro').then(m => m.Registro) },
  { path: 'panel', loadComponent: () => import('./page/panel/panel').then(m => m.Panel), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_STATE,ROLES.ADMIN_MUNICIPAL,ROLES.ADMIN_CIRCUITAL,ROLES.ADMIN_SQUAD,ROLES.STANDARD]} },
  { path: 'panel/control', loadComponent: () => import('./page/control/control').then(m => m.Control), canActivate: [AuthGuard], data: {requiredRoles: [ROLES.SUPER_ADMIN,ROLES.ADMIN_STATE,ROLES.ADMIN_MUNICIPAL,ROLES.ADMIN_CIRCUITAL,ROLES.ADMIN_SQUAD,ROLES.STANDARD]} },
  { path: 'panel/control/gestor', loadComponent: () => import('./page/gestor/gestor').then(m => m.GestorComponent), canActivate: [AuthGuard], data: { requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE, ROLES.ADMIN_MUNICIPAL, ROLES.ADMIN_CIRCUITAL, ROLES.ADMIN_SQUAD, ROLES.STANDARD] } },
  { path: 'panel/control/gestor/empleados', loadComponent: () => import('./page/empleados/empleados').then(m => m.Empleados), canActivate: [AuthGuard], data: { requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE, ROLES.ADMIN_MUNICIPAL, ROLES.ADMIN_CIRCUITAL, ROLES.ADMIN_SQUAD, ROLES.STANDARD] } },
  { path: 'panel/control/gestor/empleados_eliminados', loadComponent: () => import('./page/empleados-eliminados/empleados-eliminados').then(m => m.EmpleadosEliminados), canActivate: [AuthGuard], data: { requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE, ROLES.ADMIN_MUNICIPAL, ROLES.ADMIN_CIRCUITAL, ROLES.ADMIN_SQUAD] } },
  { path: 'panel/control/gestor/usuarios', loadComponent: () => import('./page/usuarios/usuarios').then(m => m.Usuarios), canActivate: [AuthGuard], data: { requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE, ROLES.ADMIN_MUNICIPAL, ROLES.ADMIN_CIRCUITAL, ROLES.ADMIN_SQUAD] } },
  { path: 'panel/control/gestor/database', loadComponent: () => import('./page/database/database').then(m => m.Database), canActivate: [AuthGuard], data: { requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE, ROLES.ADMIN_MUNICIPAL, ROLES.ADMIN_CIRCUITAL, ROLES.ADMIN_SQUAD] } },
  { path: 'panel/control/gestor/database/:tableName', loadComponent: () => import('./page/gestor-tabla/gestor-tabla').then(m => m.GestorTabla), canActivate: [AuthGuard], data: { requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE, ROLES.ADMIN_MUNICIPAL, ROLES.ADMIN_CIRCUITAL, ROLES.ADMIN_SQUAD] } },
  { path: 'panel/control/autorizacion', loadComponent: () => import('./page/autorizacion/autorizacion').then(m => m.Autorizacion), canActivate: [AuthGuard], data: { requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE, ROLES.ADMIN_MUNICIPAL, ROLES.ADMIN_CIRCUITAL, ROLES.ADMIN_SQUAD] } },
  { path: '', redirectTo: 'panel', pathMatch: 'full' }
];