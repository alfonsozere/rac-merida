import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from './auth';
//import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: Auth) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // --- DEBUG 1: URL de la petición que el interceptor está viendo ---

    const token = this.authService.getToken(); // Esta llamada ya tiene su propio log en AuthService

    // Si hay un token y la petición NO es a los endpoints de login/registro
    if (token && !request.url.includes('/auth/login') && !request.url.includes('/auth/register')) {
      const clonedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      // --- DEBUG 2: Cabecera Authorization añadida ---
      return next.handle(clonedRequest);
    }
    // Si hay token pero la petición es de login/registro (no se añade token para evitar bucles/errores)
    else if (token && (request.url.includes('/auth/login') || request.url.includes('/auth/register'))) {
      return next.handle(request);
    }
    // Si no hay token o la petición es a un endpoint que no requiere token
    else {
      return next.handle(request);
    }
  }
}
