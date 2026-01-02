import { Injectable, inject } from '@angular/core';
import { Usuario } from '../models/usuario.model';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs'; // <-- ¡NUEVA IMPORTACIÓN!
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  // Inyectamos HttpClient para las consultas de validación asíncrona
  private http = inject(HttpClient);
  
  private readonly TOKEN_KEY = 'jwt_token'; // Clave para guardar el token
  private readonly USER_KEY = 'current_user'; // Clave para guardar los datos del usuario
  private readonly API_URL = 'https://tu-api.com/api/auth'; // URL base para validaciones

  // 1. BehaviorSubject: Almacena el estado en memoria. Lo inicializamos cargando el usuario de localStorage.
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.loadUserFromStorage());
  
  // 2. Observable público para que los componentes se suscriban (HeaderComponent).
  currentUser$: Observable<Usuario | null> = this.currentUserSubject.asObservable();


  constructor(private router: Router) { }

  /**
   * Método para verificar si un valor (cédula, correo, usuario) ya existe en la BD.
   * Se utiliza en los validadores asíncronos del formulario de registro.
   */
  checkAvailability(field: string, value: string): Observable<boolean> {
    return this.http.get<{ exists: boolean }>(`${this.API_URL}/check-availability`, {
      params: { field, value }
    }).pipe(
      map(response => response.exists)
    );
  }

  /**
   * Método auxiliar para cargar el usuario desde localStorage una sola vez al inicializar el servicio.
   * Esto asegura que el BehaviorSubject tenga el estado correcto al inicio.
   */
  private loadUserFromStorage(): Usuario | null {
    const userDataString = localStorage.getItem(this.USER_KEY);
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        if (userData && typeof userData === 'object' && userData.cod_rol !== undefined && userData.id_usuario !== undefined) {
          return userData as Usuario;
        }
      } catch (e) {
        console.error('Error al parsear datos de usuario de localStorage.', e);
      }
    }
    return null;
  }


  /**
   * Guarda el token JWT y los datos del usuario en el almacenamiento local.
   * @param token El token JWT recibido del backend.
   * @param userData Los datos del usuario logueado, ahora incluyendo campos de circuito.
   */
  saveAuthData(token: string, userData: Usuario): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(userData)); // Guardar como string JSON
    
    // ¡CAMBIO CRÍTICO A! Notificar a los suscriptores (encabezado) sobre el nuevo usuario
    this.currentUserSubject.next(userData); 
  }

  /**
   * Obtiene el token JWT del almacenamiento local.
   * @returns El token JWT o null si no existe.
   */
  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return token;
  }

  /**
   * Obtiene los datos del usuario del BehaviorSubject (estado en memoria).
   * El código original dependía de leer localStorage cada vez, ahora lee el estado reactivo.
   * @returns Los datos del usuario o null si no existe, ahora incluyendo campos de circuito.
   */
  getUserData(): Usuario | null {
    // ¡CAMBIO B! Usar el valor actual del BehaviorSubject para una lectura rápida en memoria.
    return this.currentUserSubject.getValue(); 
  }

  /**
   * Verifica si el usuario está autenticado (si hay un token presente y datos de usuario válidos).
   * @returns True si hay un token y datos de usuario válidos, false en caso contrario.
   */
  isAuthenticated(): boolean {
    const token = this.getToken(); 
    const userData = this.getUserData(); 
    // Verificar si hay token y si los datos del usuario son válidos y completos
    return !!token && !!userData && userData.cod_rol !== undefined && userData.id_usuario !== undefined;
  }

  /**
   * Cierra la sesión del usuario, eliminando el token y los datos del almacenamiento local.
   * Redirige al usuario a la página de login.
   */
  logout(): void {
    // ¡CAMBIO CRÍTICO C! Notificar a los suscriptores (encabezado) que el usuario es nulo.
    this.currentUserSubject.next(null);

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']); // Redirige a la página de login
  }
}

