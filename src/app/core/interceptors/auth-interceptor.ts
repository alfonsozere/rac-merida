import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from '../services/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: Auth) { }
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // --- DEBUG: Muestra la URL que el interceptor está procesando ---
    console.log(`[INTERCEPTOR DEBUG] Procesando URL: ${request.url}`);
    
    const token = this.authService.getToken(); 

    // Si hay un token Y la petición NO es a los endpoints de login/registro
    if (token && !request.url.includes('/auth/login') && !request.url.includes('/auth/register')) {
        // --- DEBUG: Confirma que se va a añadir el token ---
        console.log(`[INTERCEPTOR DEBUG] TOKEN OK. Añadiendo 'Authorization' a: ${request.url}`);

      const clonedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(clonedRequest);
    }

    // Si hay token pero la petición es de login/registro (no se añade token)
    else if (token && (request.url.includes('/auth/login') || request.url.includes('/auth/register'))) {
        // --- DEBUG: Muestra que se saltó la adición del token por ser una ruta de auth ---
        console.log(`[INTERCEPTOR DEBUG] RUTA AUTH. Saltando adición de token para: ${request.url}`);
      return next.handle(request);
    }

    // Si no hay token O la petición es a otra URL que no requiere token (o protegida sin token)
    else {
        // ESTE ES EL BLOQUE QUE QUEREMOS DEPURAR
        if (!token) {
            // LOG 3: Si se llegó aquí Y la causa es la falta de token, lo avisa.
            console.warn(`[INTERCEPTOR DEBUG] ¡FALTA TOKEN! Petición no autorizada enviada a: ${request.url}`); 
        }
      return next.handle(request);
    }
  }
}