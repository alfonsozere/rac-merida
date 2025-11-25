import { Usuario } from "./usuario.model";

/**
 * @interface LoginPayload
 * @description Interfaz para el cuerpo de la solicitud de inicio de sesión de usuario.
 */
export interface LoginPayload {
  usuario: string;
  contrasena: string;
}

// Interfaces de Autenticación - Respuestas
/**
 * @interface LoginResponse
 * @description Interfaz para la respuesta exitosa del inicio de sesión.
 * Consolidada.
 */
export interface LoginResponse {
  token: string;
  usuario: Usuario; // Utiliza la interfaz Usuario consolidada para los datos del usuario logueado
  msg?: string;
}
