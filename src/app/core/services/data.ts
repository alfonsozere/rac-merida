import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
// IMPORTANTE: Asegúrate de que esta ruta sea correcta en tu proyecto


// Define la estructura que describirá cada columna de la tabla.
export interface ColumnMetadata {
  key: string;
  title: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  sortable: boolean;
  visible: boolean;
}

//PARA BORRAR
interface ApiResponse {
  ok?: boolean;
  msg?: string;
  [key: string]: any; // Permite acceder a 'roles', 'sexos', etc.
}

// Define la estructura base de una fila de datos dinámica.
export type DynamicRow = Record<string, any>;

// --- METADATOS SIMULADOS (ESTO SÍ PUEDE SER FIJO) ---
// La estructura de la tabla (qué columnas existen) se mantiene en un mock 
// ya que la API a menudo no proporciona esta información.
const MOCK_METADATA: Record<string, ColumnMetadata[]> = {
  // Metadatos de la tabla 'sexos' basados en la respuesta real de la API
  // Usuarios
  'users': [
    // --- DATOS PRINCIPALES ---
    { key: 'id_usuario', title: 'ID', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
    { key: 'apellido', title: 'Apellido', type: 'text', sortable: true, visible: true },
    { key: 'tipo_cedula', title: 'Tipo Cédula', type: 'text', sortable: true, visible: false },
    { key: 'cedula', title: 'Cédula', type: 'text', sortable: true, visible: true },
    { key: 'usuario', title: 'Usuario', type: 'text', sortable: true, visible: true },
    { key: 'correo', title: 'Correo', type: 'text', sortable: true, visible: false },
    { key: 'telefono', title: 'Teléfono', type: 'text', sortable: true, visible: false },

    // --- ROL ASIGNADO (ACTUAL) ---
    { key: 'cod_rol', title: 'Cod. Rol', type: 'number', sortable: true, visible: false },
    { key: 'nombre_rol', title: 'Rol Asignado', type: 'text', sortable: true, visible: true },
    { key: 'descripcion_rol', title: 'Descripción Rol', type: 'text', sortable: false, visible: false },

    // --- UBICACIÓN ASIGNADA (ACTUAL) ---
    { key: 'id_estado_asignado', title: 'ID Edo. Asig.', type: 'number', sortable: true, visible: false },
    { key: 'nombre_estado_asignado', title: 'Estado Asignado', type: 'text', sortable: true, visible: true },
    { key: 'id_municipio_asignado', title: 'ID Mun. Asig.', type: 'number', sortable: true, visible: false },
    { key: 'nombre_municipio_asignado', title: 'Municipio Asignado', type: 'text', sortable: true, visible: true },
    { key: 'id_circuito_asignado', title: 'ID Circuito Asig.', type: 'number', sortable: true, visible: false },
    { key: 'nombre_circuito_asignado', title: 'Circuito Asignado', type: 'text', sortable: true, visible: true },
    { key: 'codigo_plantel_asignado', title: 'Cód. Plantel Asig.', type: 'text', sortable: true, visible: false },
    { key: 'nombre_plantel_asignado', title: 'Plantel Asignado', type: 'text', sortable: true, visible: true },
    { key: 'denominacion_plantel_asignado', title: 'Denom. Plantel Asig.', type: 'text', sortable: true, visible: false },

    // --- DATOS DE REGISTRO/APROBACIÓN ---
    { key: 'fecha_registro', title: 'Fec. Registro', type: 'date', sortable: true, visible: true },
    { key: 'fecha_aprobacion', title: 'Fec. Aprobación', type: 'date', sortable: true, visible: true },

    // --- ROL SUGERIDO (PENDIENTE DE APROBACIÓN) ---
    { key: 'cod_rol_sugerido', title: 'Cod. Rol Sug.', type: 'number', sortable: true, visible: false },
    { key: 'nombre_rol_sugerido', title: 'Rol Sugerido', type: 'text', sortable: true, visible: true },

    // --- UBICACIÓN SUGERIDA (PENDIENTE DE APROBACIÓN) ---
    { key: 'id_estado_sugerido', title: 'ID Edo. Sug.', type: 'number', sortable: true, visible: false },
    { key: 'nombre_estado_sugerido', title: 'Estado Sugerido', type: 'text', sortable: true, visible: false },
    { key: 'id_municipio_sugerido', title: 'ID Mun. Sug.', type: 'number', sortable: true, visible: false },
    { key: 'nombre_municipio_sugerido', title: 'Municipio Sugerido', type: 'text', sortable: true, visible: false },
    { key: 'id_circuito_sugerido', title: 'ID Circuito Sug.', type: 'number', sortable: true, visible: false },
    { key: 'nombre_circuito_sugerido', title: 'Circuito Sugerido', type: 'text', sortable: true, visible: false },
    { key: 'codigo_plantel_sugerido', title: 'Cód. Plantel Sug.', type: 'text', sortable: true, visible: false },
    { key: 'nombre_plantel_sugerido', title: 'Plantel Sugerido', type: 'text', sortable: true, visible: false },
    { key: 'denominacion_plantel_sugerido', title: 'Denom. Plantel Sug.', type: 'text', sortable: true, visible: false },

  ],
  // Roles
  'roles': [
    { key: 'id_rol', title: 'ID', type: 'number', sortable: true, visible: true },
    { key: 'nombre_rol', title: 'Nombre', type: 'text', sortable: true, visible: true },
    { key: 'descripcion', title: 'Descripción', type: 'text', sortable: true, visible: true },
    { key: 'ide', title: 'Nombre', type: 'text', sortable: true, visible: false },
  ],
  //Sexos
  'sexos': [
    { key: 'id', title: 'ID', type: 'number', sortable: true, visible: true },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
    { key: 'abrev_sexo', title: 'Abreviatura', type: 'text', sortable: true, visible: true },
  ],
  // Empleados
  'empleados': [
    // --- DATOS PRINCIPALES ---
    { key: 'id_empleado', title: 'ID Empleado', type: 'number', sortable: true, visible: false },
    { key: 'cedula', title: 'Cédula', type: 'text', sortable: true, visible: true },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
    { key: 'apellido', title: 'Apellido', type: 'text', sortable: true, visible: true },
    { key: 'correo', title: 'Correo', type: 'text', sortable: true, visible: true },
    { key: 'telefono', title: 'Teléfono', type: 'text', sortable: true, visible: true },
    { key: 'direccion', title: 'Dirección', type: 'text', sortable: false, visible: false },

    // --- FECHAS Y HORAS ---
    { key: 'fecha_nacimiento', title: 'Fec. Nacimiento', type: 'date', sortable: true, visible: true },
    { key: 'fecha_ingreso_laboral', title: 'Fec. Ingreso Lab.', type: 'date', sortable: true, visible: true },
    { key: 'horas_academicas', title: 'H. Académicas', type: 'number', sortable: true, visible: false },
    { key: 'horas_administrativas', title: 'H. Administrativas', type: 'number', sortable: true, visible: false },

    // --- INFORMACIÓN RELACIONADA (FKs visibles y ocultas) ---
    // Sexo
    { key: 'id_sexo', title: 'ID Sexo', type: 'number', sortable: true, visible: false },
    { key: 'nombre_sexo', title: 'Sexo', type: 'text', sortable: true, visible: true },

    // Tipo Personal y Situación Laboral
    { key: 'id_tipo_personal', title: 'ID Tipo Personal', type: 'number', sortable: true, visible: false },
    { key: 'nombre_tipo_personal', title: 'Tipo Personal', type: 'text', sortable: true, visible: true },
    { key: 'id_situacion_laboral', title: 'ID Situación Lab.', type: 'number', sortable: true, visible: false },
    { key: 'nombre_situacion_laboral', title: 'Situación Laboral', type: 'text', sortable: true, visible: true },

    // Cargo Display
    { key: 'cargo_display_name', title: 'Cargo Actual', type: 'text', sortable: true, visible: true },

    // Plantel (Resumen)
    { key: 'id_plantel', title: 'ID Plantel', type: 'number', sortable: true, visible: false },
    { key: 'plantel_nombre', title: 'Plantel', type: 'text', sortable: true, visible: true },
    { key: 'plantel_codigo', title: 'Cód. Plantel', type: 'text', sortable: true, visible: false },
    { key: 'plantel_nombre_circuito', title: 'Circuito', type: 'text', sortable: true, visible: true },
    { key: 'plantel_municipio_nombre', title: 'Municipio', type: 'text', sortable: true, visible: true },

    // Ubicación Geográfica (Detalles)
    { key: 'id_ubch', title: 'ID UBCH', type: 'number', sortable: true, visible: false },
    { key: 'nombre_ubch', title: 'UBCH', type: 'text', sortable: true, visible: false },
    { key: 'id_comuna', title: 'ID Comuna', type: 'number', sortable: true, visible: false },
    { key: 'nombre_comuna', title: 'Comuna', type: 'text', sortable: true, visible: false },
    { key: 'id_consejo_comunal', title: 'ID CC', type: 'number', sortable: true, visible: false },
    { key: 'nombre_consejo_comunal', title: 'Consejo Comunal', type: 'text', sortable: true, visible: false },

    // Turno
    { key: 'id_turno', title: 'ID Turno', type: 'number', sortable: true, visible: false },
    { key: 'nombre_turno', title: 'Turno', type: 'text', sortable: true, visible: false },

    // Observaciones
    { key: 'observaciones', title: 'Observaciones', type: 'text', sortable: false, visible: false },

    // --- CAMPOS ESPECÍFICOS DE CARGO (Mayormente ocultos si no aplica) ---
    // Docente
    { key: 'id_cargo_docente', title: 'ID Cargo Docente', type: 'number', sortable: true, visible: false },
    { key: 'cargo_nombre_docente', title: 'Cargo Docente', type: 'text', sortable: true, visible: false },
    { key: 'grado_imparte', title: 'Grado', type: 'text', sortable: true, visible: false },
    { key: 'seccion_grado', title: 'Sección G.', type: 'text', sortable: true, visible: false },

    // Obrero
    { key: 'id_cargo_obrero', title: 'ID Cargo Obrero', type: 'number', sortable: true, visible: false },
    { key: 'cargo_nombre_obrero', title: 'Cargo Obrero', type: 'text', sortable: true, visible: false },
    { key: 'id_grado_obrero', title: 'ID Grado Obrero', type: 'number', sortable: true, visible: false },
    { key: 'grado_obrero_nombre', title: 'Grado Obrero', type: 'text', sortable: true, visible: false },

    // Administrativo
    { key: 'id_cargo_administrativo', title: 'ID Cargo Admin', type: 'number', sortable: true, visible: false },
    { key: 'cargo_nombre_administrativo', title: 'Cargo Admin', type: 'text', sortable: true, visible: false },
  ],
  // Tipo de personal
  'tipos_personal': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Situaciones Laborales
  'situaciones_laborales': [
    { key: 'id', title: 'ID', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
    { key: 'descripcion', title: 'Descripción', type: 'text', sortable: true, visible: true }
  ],
  // Docentes
  'cargos_docentes': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Administrativos
  'cargos_administrativos': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Grados obrero
  'grados_obreros': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
    { key: 'grado_tipo', title: 'Tipo de grado', type: 'text', sortable: true, visible: true },
    { key: 'gado_codigo', title: 'Gódigo grado', type: 'text', sortable: true, visible: true },
    { key: 'descripcion', title: 'Descripción', type: 'text', sortable: true, visible: false },
  ],
  // Obreros
  'cargos_obreros': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Tipo docentes especificos
  'tipos_docente_especificos': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Estados
  'estados': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Municipios
  'municipios': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Parroquias
  // Circuitos educativos
  'circuitos': [
    { key: 'id_circuito', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre_circuito', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Planteles
  'planteles': [
    // --- CLAVES PRINCIPALES Y CÓDIGOS (Generalmente ocultos o al principio) ---
    { key: 'id_plantel', title: 'ID', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
    { key: 'codigo_plantel', title: 'Cód. Plantel', type: 'text', sortable: false, visible: true },
    { key: 'codigo_administrativo', title: 'Cód. Administrativo', type: 'text', sortable: false, visible: false },
    { key: 'codigo_estadistico', title: 'Cód. Estadístico', type: 'text', sortable: false, visible: false },
    { key: 'codigo_electoral', title: 'Cód. Electoral', type: 'text', sortable: false, visible: false },

    // --- DATOS DE CONTACTO y DETALLE ---
    { key: 'direccion', title: 'Dirección', type: 'text', sortable: false, visible: false },
    { key: 'telefono', title: 'Teléfono', type: 'text', sortable: false, visible: true },
    { key: 'correo', title: 'Correo', type: 'text', sortable: false, visible: false },
    { key: 'fundacion', title: 'Fundación', type: 'date', sortable: true, visible: true },

    // --- RELACIONES GEOGRÁFICAS (Mostrando el nombre legible) ---
    { key: 'estado_nombre', title: 'Estado', type: 'text', sortable: true, visible: true },
    { key: 'municipio_nombre', title: 'Municipio', type: 'text', sortable: true, visible: true },
    { key: 'parroquia_nombre', title: 'Parroquia', type: 'text', sortable: true, visible: false },
    { key: 'circuito_nombre', title: 'Circuito Educativo', type: 'text', sortable: true, visible: true },

    // --- RELACIONES DE CARACTERÍSTICAS (Mostrando el nombre legible) ---
    { key: 'denominacion_nombre', title: 'Denominación', type: 'text', sortable: true, visible: true },
    { key: 'dependencia_nombre', title: 'Dependencia', type: 'text', sortable: true, visible: true },
    { key: 'ubicacion_nombre', title: 'Ubicación', type: 'text', sortable: true, visible: true },
    { key: 'nivel_nombre', title: 'Nivel', type: 'text', sortable: true, visible: true },
    { key: 'modalidad_nombre', title: 'Modalidad', type: 'text', sortable: true, visible: false },
    { key: 'turno_nombre', title: 'Turno', type: 'text', sortable: true, visible: true },
    
    // --- ORGANIZACIÓN SOCIAL (Opcional, visible: false si son a menudo null) ---
    { key: 'comuna_nombre', title: 'Comuna', type: 'text', sortable: false, visible: false },
    { key: 'consejo_comunal_nombre', title: 'Consejo Comunal', type: 'text', sortable: false, visible: false },
    { key: 'ubch_nombre', title: 'UBCH', type: 'text', sortable: false, visible: false },

    // --- IDs DE RELACIÓN (Ocultos, solo para formularios de edición/creación) ---
    { key: 'id_denominacion', title: 'ID Denom.', type: 'number', sortable: false, visible: false },
    { key: 'id_dependencia', title: 'ID Depend.', type: 'number', sortable: false, visible: false },
    { key: 'id_ubicacion', title: 'ID Ubic.', type: 'number', sortable: false, visible: false },
    { key: 'id_nivel', title: 'ID Nivel', type: 'number', sortable: false, visible: false },
    { key: 'id_modalidad', title: 'ID Modal.', type: 'number', sortable: false, visible: false },
    { key: 'id_turno', title: 'ID Turno', type: 'number', sortable: false, visible: false },
    { key: 'id_parroquia', title: 'ID Parr.', type: 'number', sortable: false, visible: false },
    { key: 'id_municipio', title: 'ID Mun.', type: 'number', sortable: false, visible: false },
    { key: 'id_estado', title: 'ID Edo.', type: 'number', sortable: false, visible: false },
    { key: 'id_circuito', title: 'ID Circuito', type: 'number', sortable: false, visible: false },
    { key: 'id_ubch', title: 'ID UBCH', type: 'number', sortable: false, visible: false },
    { key: 'id_comuna', title: 'ID Comuna', type: 'number', sortable: false, visible: false },
    { key: 'id_consejo_comunal', title: 'ID CC', type: 'number', sortable: false, visible: false }
],
  // Denominación planteles
  'denominaciones_plantel': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Dependencias planteles
  'dependencias_plantel': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Niveles planteles
  'niveles_plantel': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Modalidades planteles
  'modalidades_plantel': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Ubicación planteles
  'ubicaciones_plantel': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Turno planteles
  'turnos': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Comunas
  'comunas': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // ubchs
  'consejos_comunales': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
  // Consejo comunales
  'ubchs': [
    { key: 'id', title: 'IDs', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
  ],
};
// --- FIN METADATOS SIMULADOS ---


@Injectable({
  providedIn: 'root'
})
export class Data {
  private http = inject(HttpClient);
  // Usa la URL base importada del entorno para la conexión real
  private API_BASE_URL = environment.apiUrl;

  constructor() { }

  /**
   * Obtiene la estructura (metadata) de la tabla especificada desde el mock local.
   */
  getMetadata(tableName: string): Observable<ColumnMetadata[]> {
    console.log(`[DataService] Solicitando Metadata (MOCK) para: ${tableName}`);

    // Devolvemos el mock de metadata.
    const metadata = MOCK_METADATA[tableName] || [];

    return new Observable<ColumnMetadata[]>(observer => {
      if (metadata.length === 0) {
        console.warn(`Advertencia: Metadata no encontrada/definida para la tabla: ${tableName}.`);
      }
      observer.next(metadata);
      observer.complete();
    });
  }

  /**
   * Obtiene los datos REALES de la tabla especificada haciendo una llamada HTTP.
   * La tabla ahora mostrará el contenido real de la base de datos.
   */

  // FUNCIONAL
  /* getData(tableName: string): Observable<DynamicRow[]> {
    // Construye la URL completa: 'https://cdce-merida.ddns.net/api/sexos'
    const url = `${this.API_BASE_URL}/${tableName}`;
    console.log(`[DataService] Solicitando DATOS REALES de la API: ${url}`);

    // Hace la llamada HTTP real a la API.
    return this.http.get<DynamicRow[]>(url).pipe(
      tap(data => {
        if (data.length === 0) {
          console.warn(`Advertencia: API devolvió un array vacío para la tabla: ${tableName}.`);
        }
      })
    );
  } */

  // PARA BORRAR
  getData(tableName: string): Observable<DynamicRow[]> {
    const url = `${this.API_BASE_URL}/${tableName}`;

    console.log(`[DataService] La tabla solicitada es: '${tableName}'`);

    // Cambiamos el tipo esperado a algo que pueda ser un objeto o un array
    return this.http.get<ApiResponse | DynamicRow[]>(url).pipe(
      map(response => {
        // Caso 1: La respuesta es un ARRAY directo (ej. tipos_personal)
        if (Array.isArray(response)) {
          return response as DynamicRow[];
        }

        // Caso 2: La respuesta es un OBJETO contenedor (ej. roles)
        if (typeof response === 'object' && response !== null && response[tableName]) {
          const dataArray = response[tableName];
          if (Array.isArray(dataArray)) {
            // Extraemos y devolvemos el array correcto
            return dataArray as DynamicRow[];
          }
        }

        // Si no se encuentra un array, se devuelve vacío.
        console.warn(`[DataService] No se pudo extraer el array de datos para '${tableName}'.`);
        return [] as DynamicRow[];
      }),
      catchError(err => {
        console.error(`[DataService] Fallo en la obtención de datos para ${tableName}:`, err);
        return throwError(() => new Error(`Fallo en la obtención de datos para ${tableName}: ${err.message}`));
      })
    );
  }



  /**
   * Actualiza una fila en una tabla haciendo una llamada PUT real.
   */
  updateData(tableName: string, row: DynamicRow): Observable<any> {
    // Busca la clave primaria (ID) para construir la URL de actualización
    const primaryKey = row['id'] || row['role_id'] || row['id_estado'] || 'N/A';
    const url = `${this.API_BASE_URL}/${tableName}/${primaryKey}`;

    console.log(`[DataService] Llamada PUT real a: ${url} con datos:`, row);

    // Hace la llamada PUT real.
    return this.http.put(url, row).pipe(
      tap(() => console.log(`[DataService] ACTUALIZACIÓN de ${tableName} exitosa (API Real).`))
    );
  }

  /**
   * Elimina una fila de una tabla haciendo una llamada DELETE real.
   */
  deleteData(tableName: string, row: DynamicRow): Observable<any> {
    const primaryKey = row['id'] || row['role_id'] || row['id_estado'] || 'N/A';
    const url = `${this.API_BASE_URL}/${tableName}/${primaryKey}`;

    console.warn(`[DataService] Llamada DELETE real a: ${url}`);

    // Hace la llamada DELETE real.
    return this.http.delete(url).pipe(
      tap(() => console.log(`[DataService] ELIMINACIÓN de ${tableName} exitosa (API Real).`))
    );
  }
}