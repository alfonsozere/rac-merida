import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { EmpleadoEliminado } from '../../../../core/models/empleado-eliminado.model';
import { Api } from '../../../../core/services/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empleado-eliminado',
  imports: [CommonModule],
  templateUrl: './empleado-eliminado-director.html',
  styleUrls: ['./empleado-eliminado-director.css']   // ojo: debe ser styleUrls (plural)
})
export class EmpleadoEliminadoDirector implements OnInit {
  empleados: EmpleadoEliminado[] = [];
  cargando = false;
  error: string | null = null;

  // 🔹 Nuevo: salida al padre
  @Output() goBack = new EventEmitter<void>();

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.cargarEmpleadosEliminados();
  }

  cargarEmpleadosEliminados(): void {
    this.cargando = true;
    this.api.getEmpleadosEliminados().subscribe({
      next: (data) => {
        this.empleados = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar empleados eliminados';
        this.cargando = false;
      }
    });
  }

  restaurarEmpleado(id: number): void {
    this.api.restoreEmpleado(id).subscribe({
      next: (resp) => {
        this.error = resp.msg; // Mensaje de éxito
        this.cargarEmpleadosEliminados(); // Recargar la lista
      },
      error: () => {
        this.error = 'Error al restaurar empleado';
      }
    });
  }

  // 🔹 Nuevo: método que el template invoca
  emitGoBack(): void {
    this.goBack.emit();
  }
}
