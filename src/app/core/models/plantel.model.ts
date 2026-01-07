/**
 * @interface Plantel
 * @description Interfaz para la información detallada de un plantel educativo, incluyendo detalles por JOINs.
 * Coincide con la salida del backend getPlanteles.
 */
export interface Plantel {
  id: number; // Mapea a id_plantel del backend
  nombre: string;
  codigo_plantel: string;
  codigo_administrativo?: string | null;
  codigo_estadistico?: string | null;
  codigo_electoral?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  fundacion?: string | null; // Formato 'YYYY-MM-DD'

  // Propiedades de detalles por JOINs (nombres amigables para mostrar)
  denominacion_nombre?: string | null;
  dependencia_nombre?: string | null;
  ubicacion_nombre?: string | null;
  nivel_nombre?: string | null;
  modalidad_nombre?: string | null;
  turno_nombre?: string | null;
  parroquia_nombre?: string | null;
  municipio_nombre?: string | null;
  estado_nombre?: string | null;
  circuito_nombre?: string | null;

  // IDs de las relaciones (claves foráneas)
  id_denominacion?: number | null;
  id_dependencia?: number | null;
  id_ubicacion?: number | null;
  id_nivel?: number | null;
  id_modalidad?: number | null;
  id_turno?: number | null;
  id_parroquia?: number | null;
  id_municipio?: number | null;
  id_estado?: number | null;
  id_circuito?: number | null; // Agregado aquí porque es una relación común, aunque no esté en el SELECT actual de getPlanteles
}
