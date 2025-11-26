import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Auth } from '../services/auth';

// ¡CRÍTICO!: Importar ROLES desde la fuente centralizada y NO definirlo aquí nuevamente.
import { ROLES } from '../constants/constantes'; 
import { Usuario } from '../models/usuario.model';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: Auth, private router: Router) {}

  /**
   * Implementación de la interfaz CanActivate para controlar el acceso a la ruta.
   * @param route - La instantánea de la ruta que se intenta activar.
   * @param state - La instantánea del estado del router.
   * @returns Un Observable, Promise o booleano que indica si la ruta puede ser activada.
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const currentUser: Usuario | null = this.authService.getUserData();

    // Paso 1: Verificar si el usuario está autenticado y tiene un rol definido
    
    if (!this.authService.isAuthenticated() || !currentUser || currentUser.cod_rol === undefined || currentUser.cod_rol === null) {
      console.warn('AuthGuard: Usuario no autenticado o sin rol. Redirigiendo a la página de inicio de sesión.');
      return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    // Paso 2: Bloquear el acceso a usuarios con rol PENDING
    if (currentUser.cod_rol === ROLES.PENDING) {
      console.warn('AuthGuard: Acceso denegado. Usuario pendiente de aprobación. Redirigiendo a la página de estado pendiente.');
      return this.router.createUrlTree(['/usuario-pendiente']);
    }

    // Paso 3: Obtener los roles requeridos para la ruta desde su configuración de datos
    const requiredRoles: number[] = route.data['requiredRoles'] as number[] || [];

    // Validar que la ruta tenga roles requeridos configurados
    if (requiredRoles.length === 0) {
      console.error(`AuthGuard: Error de configuración. La ruta '${state.url}' está protegida pero no tiene 'requiredRoles' definidos.`);
      return this.router.createUrlTree(['/acceso-denegado']); 
    }

    // Paso 4: Verificar si el rol del usuario actual está entre los roles permitidos para la ruta
    if (requiredRoles.includes(currentUser.cod_rol)) {
      // Paso 5: Aplicar validaciones geográficas adicionales para roles con ámbito específico
      switch (currentUser.cod_rol) {
        case ROLES.SUPER_ADMIN:
          // SUPER_ADMIN tiene acceso total, no requiere validaciones geográficas adicionales
          return true; 

        case ROLES.ADMIN_STATE:
          // ADMIN_STATE debe tener un estado asignado
          if (currentUser.id_estado_asignado === null || currentUser.id_estado_asignado === undefined) {
            console.warn(`AuthGuard: Acceso denegado para Admin de Estado. No tiene un estado asignado para la ruta '${state.url}'.`);
            return this.router.createUrlTree(['/acceso-denegado']);
          }
          break; 

        case ROLES.ADMIN_MUNICIPAL:
          // ADMIN_MUNICIPAL debe tener un municipio asignado
          if (currentUser.id_municipio_asignado === null || currentUser.id_municipio_asignado === undefined) {
            console.warn(`AuthGuard: Acceso denegado para Admin Municipal. No tiene un municipio asignado para la ruta '${state.url}'.`);
            return this.router.createUrlTree(['/acceso-denegado']);
          }
          break;

        case ROLES.ADMIN_CIRCUITAL:
          // ADMIN_CIRCUITAL debe tener un circuito asignado (usando el nuevo campo id_circuito_asignado)
          if (currentUser.id_circuito_asignado === null || currentUser.id_circuito_asignado === undefined) {
            console.warn(`AuthGuard: Acceso denegado para Admin Circuital. No tiene un circuito asignado para la ruta '${state.url}'.`);
            return this.router.createUrlTree(['/acceso-denegado']);
          }
          break;

        case ROLES.ADMIN_SQUAD:
        case ROLES.STANDARD:
          // ADMIN_SQUAD y STANDARD deben tener un plantel asignado
          if (currentUser.codigo_plantel_asignado === null || currentUser.codigo_plantel_asignado === undefined) {
            console.warn(`AuthGuard: Acceso denegado para Admin de Cuadrilla o Usuario Estándar. No tiene un plantel asignado para la ruta '${state.url}'.`);
            return this.router.createUrlTree(['/acceso-denegado']);
          }
          break;
        
        default:
          // Otros roles que no tienen validaciones geográficas específicas
          break;
      }
      
      // Si todas las verificaciones pasan, permitir el acceso a la ruta
      return true;

    } else {
      // El rol del usuario no está autorizado para acceder a esta ruta
      console.warn(`AuthGuard: Acceso denegado. El Rol '${currentUser.cod_rol}' no tiene autorización para la ruta '${state.url}'. Roles requeridos: [${requiredRoles.join(', ')}].`);
      return this.router.createUrlTree(['/acceso-denegado']); // Redirigir a la página de acceso denegado
    }
  }
}

