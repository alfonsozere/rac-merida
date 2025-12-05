import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, tap, throwError } from 'rxjs';

// Define la estructura que describirá cada columna de la tabla.
export interface ColumnMetadata {
  key: string;      // Nombre de la propiedad en el objeto de datos (e.g., 'nombre_completo')
  title: string;    // Título a mostrar en la cabecera de la tabla (e.g., 'Nombre Completo')
  type: 'text' | 'number' | 'date' | 'boolean'; // Tipo de dato para renderizado y filtrado
  sortable: boolean; // Indica si la columna es ordenable
  visible: boolean; // Indica si la columna debe ser mostrada por defecto
}

// Define la estructura base de una fila de datos dinámica.
export type DynamicRow = Record<string, any>;

// --- DATOS MOCK SIMULADOS PARA EJEMPLO DE TABLAS ---
const MOCK_METADATA: Record<string, ColumnMetadata[]> = {
  'sexos': [
    { key: 'id', title: 'ID', type: 'number', sortable: true, visible: true },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
    { key: 'descripcion', title: 'Descripción', type: 'text', sortable: false, visible: true },
    { key: 'fecha_creacion', title: 'Fecha Creación', type: 'date', sortable: true, visible: false },
    { key: 'activo', title: 'Activo', type: 'boolean', sortable: true, visible: true },
  ],
  'roles': [
    { key: 'role_id', title: 'Cód. Rol', type: 'number', sortable: true, visible: true },
    { key: 'nombre', title: 'Nombre', type: 'text', sortable: true, visible: true },
    { key: 'nivel_acceso', title: 'Nivel Acceso', type: 'number', sortable: true, visible: true },
    { key: 'usuarios_asociados', title: 'Usuarios (Count)', type: 'number', sortable: false, visible: true },
  ],
  'estados': [
    { key: 'id_estado', title: 'ID Estado', type: 'number', sortable: true, visible: false },
    { key: 'nombre', title: 'Estado', type: 'text', sortable: true, visible: true },
    { key: 'capital', title: 'Capital', type: 'text', sortable: true, visible: true },
    { key: 'poblacion', title: 'Población', type: 'number', sortable: true, visible: true },
  ],
};

const MOCK_DATA: Record<string, DynamicRow[]> = {
  'sexos': [
    { id: 1, nombre: 'Masculino', descripcion: 'Identidad masculina', fecha_creacion: '2023-01-15T10:00:00Z', activo: true },
    { id: 2, nombre: 'Femenino', descripcion: 'Identidad femenina', fecha_creacion: '2023-01-16T11:30:00Z', activo: true },
    { id: 3, nombre: 'Otro', descripcion: 'Identidad no binaria o indefinida', fecha_creacion: '2023-01-17T09:45:00Z', activo: false },
  ],
  'roles': [
    { role_id: 100, nombre: 'SUPER_ADMIN', nivel_acceso: 100, usuarios_asociados: 5 },
    { role_id: 50, nombre: 'ADMIN_STATE', nivel_acceso: 50, usuarios_asociados: 12 },
    { role_id: 10, nombre: 'STANDARD', nivel_acceso: 10, usuarios_asociados: 300 },
  ],
  'estados': [
    { id_estado: 1, nombre: 'Mérida', capital: 'Mérida', poblacion: 900000 },
    { id_estado: 2, nombre: 'Zulia', capital: 'Maracaibo', poblacion: 4000000 },
    { id_estado: 3, nombre: 'Carabobo', capital: 'Valencia', poblacion: 2500000 },
  ],
};
// --- FIN DATOS MOCK ---


@Injectable({
  providedIn: 'root'
})
// La clase se llama Data, pero funciona como el DataService.
export class Data { 
  private http = inject(HttpClient);
  private API_URL = '/api/v1/dynamic';

  constructor() { }

  /**
   * Obtiene la estructura (metadata) de la tabla especificada.
   */
  getMetadata(tableName: string): Observable<ColumnMetadata[]> {
    console.log(`[DataService] Solicitando Metadata para: ${tableName}`);
    
    // Devolvemos el mock con un retraso para simular la latencia de red
    const metadata = MOCK_METADATA[tableName] || [];
    
    return of(metadata).pipe(delay(500), tap(() => {
        if(metadata.length === 0) {
            console.warn(`Advertencia: Metadata no encontrada/definida para la tabla: ${tableName}.`);
        }
    }));
  }

  /**
   * Obtiene los datos reales de la tabla especificada.
   */
  getData(tableName: string): Observable<DynamicRow[]> {
    console.log(`[DataService] Solicitando Datos para: ${tableName}`);

    // Devolvemos el mock con un retraso para simular la latencia de red
    const data = MOCK_DATA[tableName] || [];
    
    return of(data).pipe(delay(750), tap(() => {
        if(data.length === 0) {
            console.warn(`Advertencia: No se encontraron datos MOCK para la tabla: ${tableName}. Devolviendo array vacío.`);
        }
    }));
  }
  
  /**
   * Simula la actualización de una fila en una tabla.
   * @param tableName El nombre de la tabla.
   * @param row La fila completa con los datos actualizados.
   * @returns Observable<boolean> verdadero si la operación fue exitosa.
   */
  updateData(tableName: string, row: DynamicRow): Observable<boolean> {
    // CORRECCIÓN: Usar notación de corchetes para 'id' y 'role_id'
    console.log(`[DataService] Simulación de ACTUALIZACIÓN en ${tableName} para el ID: ${row['id'] || row['role_id']}`);
    
    // Simulación de validación
    if (!row['nombre']) {
        return throwError(() => new Error('El campo "nombre" no puede estar vacío.'));
    }
    
    // Simulación de la operación exitosa con retardo
    return of(true).pipe(delay(1000), tap(() => {
        console.log(`[DataService] ACTUALIZACIÓN de ${tableName} exitosa (Simulado).`);
    }));
  }

  /**
   * Simula la eliminación de una fila de una tabla.
   * @param tableName El nombre de la tabla.
   * @param row La fila a eliminar (usada para obtener el ID).
   * @returns Observable<boolean> verdadero si la operación fue exitosa.
   */
  deleteData(tableName: string, row: DynamicRow): Observable<boolean> {
    // CORRECCIÓN: Usar notación de corchetes para 'id' y 'role_id'
    const primaryKey = row['id'] || row['role_id'] || 'N/A';
    console.warn(`[DataService] Simulación de ELIMINACIÓN en ${tableName} del ID: ${primaryKey}`);

    // Simulación de la operación exitosa con retardo
    return of(true).pipe(delay(500), tap(() => {
        console.log(`[DataService] ELIMINACIÓN de ${tableName} exitosa (Simulado).`);
    }));
  }
}