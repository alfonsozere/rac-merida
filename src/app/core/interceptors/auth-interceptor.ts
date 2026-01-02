import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Auth } from '../services/auth'; // Asegúrate de que la ruta al servicio Auth sea correcta

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: Auth) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    const url = request.url.toLowerCase();

    // 1. Definición de la "Lista Blanca" extendida (Exclusión por Intención)
    // Estas rutas deben permitir el acceso sin token durante el proceso de registro
    const isPublicRoute = 
      url.includes('/api/auth/') || 
      url.includes('/api/estados') || 
      url.includes('/api/municipios') || 
      url.includes('/api/circuitos/municipio') || 
      url.includes('/api/planteles/municipios') ||
      url.includes('/api/planteles/circuito') ||
      url.includes('/api/planteles/estados');

    let authReq = request;

    // 2. Lógica de Inyección de Token
    // Si el token existe, se adjunta SIEMPRE para dar contexto al backend (incluso en rutas públicas)
    if (token) {
      authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else if (!isPublicRoute) {
      // 3. Registro de advertencia para rutas protegidas detectadas sin token
      console.warn(`[INTERCEPTOR] Acceso a ruta protegida sin token: ${request.url}`);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Manejo de errores de autenticación (Token expirado o inválido)
        if (error.status === 401) {
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}