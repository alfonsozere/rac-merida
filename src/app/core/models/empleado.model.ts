/**
 * @interface Empleado
 * @description Interfaz para la información detallada de un empleado.
 */
export interface Empleado {
  id_empleado: number;
  cedula: string;
  nombre: string;
  apellido: string;

  id_sexo?: number | null;
  nombre_sexo?: string | null;
  fecha_nacimiento?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;

  id_ubch?: number | null;
  nombre_ubch?: string | null;
  id_comuna?: number | null;
  nombre_comuna?: string | null;
  id_consejo_comunal?: number | null;
  nombre_consejo_comunal?: string | null;

  fecha_ingreso_laboral?: string | null;
  id_tipo_personal?: number | null;
  nombre_tipo_personal?: string | null;
  horas_academicas?: number | null;
  horas_administrativas?: number | null;
  id_turno?: number | null;
  nombre_turno?: string | null;
  grado_imparte?: string | null;
  seccion_grado?: string | null;
  area_imparte?: string | null;
  anio_imparte?: string | null;
  seccion_anio?: string | null;
  materia_especialidad?: string | null;
  periodo_grupo?: string | null;
  observaciones?: string | null;
  id_situacion_laboral?: number | null;
  nombre_situacion_laboral?: string | null;

  id_plantel?: number | null;
  plantel_nombre?: string | null;
  plantel_codigo?: string | null;
  plantel_id_circuito?: number | null;
  plantel_nombre_circuito?: string | null;
  plantel_municipio_id?: number | null;
  plantel_municipio_nombre?: string | null;
  plantel_estado_id?: number | null;
  plantel_estado_nombre?: string | null;

  id_cargo_docente?: number | null;
  codigo_docente_sufijo?: string | null;
  cargo_nombre_docente?: string | null;
  id_cargo_administrativo?: number | null;
  cargo_nombre_administrativo?: string | null;
  cargo_codigo_administrativo?: string | null;
  id_cargo_obrero?: number | null;
  cargo_nombre_obrero?: string | null;
  id_grado_obrero?: number | null;
  grado_obrero_nombre?: string | null;
  grado_obrero_codigo?: string | null;
  grado_obrero_tipo?: string | null;
  grado_obrero_descripcion?: string | null;
  id_tipo_docente_especifico?: number | null;
  tipo_docente_especifico_nombre?: string | null;

  cargo_display_name?: string | null;
}
