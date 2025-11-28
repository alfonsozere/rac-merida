import { Component, OnInit } from '@angular/core';
import { EmpleadoEliminado } from '../../../../core/models/empleado-eliminado.model';
import { Api } from '../../../../core/services/api';


@Component({
  selector: 'app-empleado-eliminado',
  imports: [],
  templateUrl: './empleado-eliminado-director.html',
  styleUrl: './empleado-eliminado-director.css'
})
export class EmpleadoEliminadoDirector implements OnInit {
  empleados: EmpleadoEliminado[] = [];
  cargando = false;
  error: string | null = null;

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
      error: (err) => {
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
      error: (err) => {
        this.error = 'Error al restaurar empleado';
      }
    });
  }
}