/**
 * @interface Usuario
 * @description Interfaz CONSOLIDADA para los datos completos de un usuario,
 * incluyendo información de perfil, rol y asignaciones geográficas.
 */
export interface Usuario {
  id_usuario?: number; // Identificador único del usuario
  cedula: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  usuario: string; // Nombre de usuario para el inicio de sesión
  cod_rol: number; // Código numérico del rol asignado actualmente al usuario
  fecha_registro?: string | null;
  fecha_aprobacion?: string | null;

  // Propiedades que se obtienen mediante JOINs en el backend (nombres legibles del rol)
  nombre_rol?: string;
  descripcion_rol?: string;

  // Asignaciones geográficas actuales del usuario (pueden ser nulas si no aplican para el rol)
  id_estado_asignado?: number | null;
  nombre_estado_asignado?: string | null;
  id_municipio_asignado?: number | null;
  nombre_municipio_asignado?: string | null;
  id_circuito_asignado?: number | null;
  nombre_circuito_asignado?: string | null;
  codigo_plantel_asignado?: string | null;
  nombre_plantel_asignado?: string | null;
  
  // Propiedades para sugerencias de rol y ámbito (utilizadas para usuarios PENDING)
  cod_rol_sugerido?: number | null;
  nombre_rol_sugerido?: string | null;
  id_estado_sugerido?: number | null;
  nombre_estado_sugerido?: string | null;
  id_municipio_sugerido?: number | null;
  nombre_municipio_sugerido?: string | null;
  id_circuito_sugerido?: number | null;
  nombre_circuito_sugerido?: string | null;
  codigo_plantel_sugerido?: string | null;
  nombre_plantel_sugerido?: string | null;

  // Campo adicional para el tipo de cédula (ej. "V", "E")
  tipo_cedula?: string;
  // 👇 propiedades adicionales para la vista
  rolSugeridoNombre?: string;
  ubicacionCompleta?: string;
  rolAutorizadorNombre?: string;

}

/**
 * @interface RegistroUsuarioPayload
 * @description Interfaz para el cuerpo de la solicitud de registro de un nuevo usuario.
 * Consolidada.
 */
export interface RegistroUsuarioPayload {
  nombre: string;
  apellido: string;
  tipo_cedula: string;
  cedula: number;
  telefono?: string;
  correo: string;
  usuario: string;
  contrasena: string;
  cod_rol_sugerido: number;
  id_estado_sugerido?: number | null;
  id_municipio_sugerido?: number | null;
  id_circuito_sugerido?: number | null;
  codigo_plantel_sugerido?: string | null;
  fecha_registro: string; // <-- **Corrección añadida aquí**
}
/**
 * @interface BackendMessageResponse
 * @description Interfaz genérica para respuestas del backend que contienen un mensaje,
 * y opcionalmente información adicional (usuario, plantel, etc.). Consolidada.
 */
export interface BackendMessageResponse {
  msg: string;
  usuario?: {
    id_usuario?: string;
    nombre?: string;
    apellido?: string;
    correo?: string;
    usuario?: string;
  };
  plantel?: { // Agregado para respuestas de creación/actualización de plantel
    id?: number;
    nombre?: string;
  };
  id_plantel?: number; // Para la respuesta de eliminación de plantel (si solo devuelve el ID)
}

/**
 * @interface RegistroResponse
 * @description Interfaz para la respuesta exitosa del proceso de registro.
 * Consolidada.
 */
export interface RegistroResponse {
  msg: string;
  token?: string;
  usuario?: {
    id_usuario: string;
    usuario: string;
    cod_rol: number;
  };
}
