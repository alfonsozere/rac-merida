import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {  provideHttpClient,  withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthInterceptor } from './core/interceptors/auth-interceptor'; // RUTA CRÍTICA: Ajusta si es necesario

// Se define la configuración del Interceptor para ser pasada en 'providers'
const authInterceptorProvider = {
  provide: HTTP_INTERCEPTORS, 
  useClass: AuthInterceptor, 
  multi: true 
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    
    // 1. Habilitar el cliente HTTP
    provideHttpClient(
        withInterceptorsFromDi() // 2. Habilitar el soporte de interceptores DI (no acepta argumentos)
    ),

    // 3. Registrar la clase del Interceptor en el arreglo principal de providers
    authInterceptorProvider
    // Nota: El orden es importante. Primero 'provideHttpClient' y sus features, luego los providers
  ]
};