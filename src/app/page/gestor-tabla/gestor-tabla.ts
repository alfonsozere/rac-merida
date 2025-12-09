import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
//import { HttpClientModule } from '@angular/common/http';
import { switchMap, tap, catchError, map } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { Data, ColumnMetadata, DynamicRow } from '../../core/services/data';


// --- Interfaces de Tipado ---
interface GestorData {
    metadata: ColumnMetadata[];
    data: DynamicRow[];
}

// --------------------------------------------------------------------------

@Component({
  selector: 'app-gestor-tabla',
  standalone: true,
  imports: [
    CommonModule,
    //HttpClientModule, 
  ],
  templateUrl: './gestor-tabla.html',
  // Eliminamos la referencia a styleUrl, ahora usamos solo Bootstrap
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestorTabla implements OnInit {

  // INYECCIÓN DE DEPENDENCIAS
  private route = inject(ActivatedRoute);
  private dataService: Data = inject(Data); 

  // ESTADO DE LA TABLA (Signals)
  public tableName = signal<string>('');
  public metadata = signal<ColumnMetadata[]>([]);
  public data = signal<DynamicRow[]>([]);
  public isLoading = signal<boolean>(true);
  public isError = signal<boolean>(false);
  public errorMessage = signal<string>('');
  
  public isActionProcessing = signal<boolean>(false);
  
  // Para la funcionalidad de eliminación (modal)
  public rowToDelete = signal<DynamicRow | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(() => {
        this.isLoading.set(true);
        this.isError.set(false);
        this.errorMessage.set('');
        this.data.set([]);
        this.metadata.set([]);
        this.rowToDelete.set(null); 
        this.isActionProcessing.set(false); // Resetear estado de acción
      }),
      switchMap((params): Observable<GestorData> => { 
        const name = params.get('tableName') || '';
        console.log(`[GestorTabla] Valor de la URL para 'tableName': ${name}`);
        
        if (!name) {
          this.isError.set(true);
          this.errorMessage.set('Error: No se proporcionó el nombre de la tabla en la ruta.');
          this.isLoading.set(false);
          return of({ metadata: [], data: [] } as GestorData);
        }
        
        this.tableName.set(name);
        console.log(`[GestorTablaComponent] Extrayendo datos para la tabla: ${name}`);

        return this.dataService.getMetadata(name).pipe(
          tap(meta => console.log(`[GestorTablaComponent] Metadata cargada para ${name}`)),
          switchMap((meta: ColumnMetadata[]) => { 
            this.metadata.set(meta);
            return this.dataService.getData(name).pipe(
              tap(data => console.log(`[GestorTablaComponent] Datos cargados para ${name}`)),
              map(data => ({ metadata: meta, data: data } as GestorData))
            );
          }),
          catchError(err => {
            console.error(`[GestorTablaComponent] Error al cargar datos para ${name}:`, err);
            this.isError.set(true);
            this.errorMessage.set(`Fallo al cargar la tabla '${name}': ${err.message || 'Error desconocido'}`);
            return of({ metadata: [], data: [] } as GestorData);
          })
        );
      })
    ).subscribe(result => {
      if (!this.isError()) {
        this.data.set(result.data);
      }
      this.isLoading.set(false);
    });
  }

  onEdit(row: DynamicRow): void {
    console.log('Editar registro:', row);
  }
  
  // La función onDelete ahora solo establece la fila a eliminar para mostrar el modal.
  onDelete(row: DynamicRow): void {
      this.rowToDelete.set(row);
  }

  // La función onConfirmDelete se cambia de nombre para evitar confusión. El HTML llama a onDelete, 
  // que muestra el modal. El modal llama a confirmDelete.
  // onConfirmDelete(row: DynamicRow): void {
  //   this.rowToDelete.set(row);
  //   // Usar notación de corchetes para acceder a 'id'
  //   console.log('Iniciando confirmación de borrado para ID:', row['id']);
  // }

  cancelDelete(): void {
    this.rowToDelete.set(null);
  }
  
  confirmDelete(): void {
      this.executeDelete();
  }

  executeDelete(): void {
    const row = this.rowToDelete();
    if (row) {
      this.isActionProcessing.set(true); // Bloquear UI
      // Usar notación de corchetes para acceder a 'id'
      console.log(`Ejecutando eliminación de ID: ${row['id']} de la tabla ${this.tableName()}`); 
      
      // Simulación de API call con timeout
      setTimeout(() => {
          // TODO: Aquí se implementaría la llamada real al servicio 'dataService.deleteData(this.tableName(), row['id'])'
          
          // Lógica de recarga o eliminación local de 'row' de this.data()
          this.data.update(currentData => currentData.filter(d => d['id'] !== row['id']));
          
          this.isActionProcessing.set(false); // Desbloquear UI
          this.rowToDelete.set(null);
          
          console.log(`Eliminación simulada exitosa para ID: ${row['id']}`);
      }, 1000);
    }
  }
  
  /**
   * Obtiene el valor de la clave principal para mostrarlo en el modal de confirmación.
   */
  public getDisplayId(): string {
    const row = this.rowToDelete();
    if (!row) {
      return 'N/A';
    }

    // Utilizamos la notación de corchetes de forma segura.
    // Se usa un orden de prioridad para encontrar la clave principal.
    return row['id'] || row['role_id'] || row['id_estado'] || 'Registro sin ID';
  }

  // Helper para el template HTML
  formatCellValue(row: DynamicRow, colKey: string): any {
    const value = row[colKey];
    const meta = this.metadata().find(m => m.key === colKey);

    if (!meta) return value; 

    switch (meta.type) {
        case 'boolean':
            return value ? 'Sí' : 'No';
        case 'date':
            return value ? new Date(value).toLocaleDateString() : '';
        default:
            return value;
    }
  }
}
