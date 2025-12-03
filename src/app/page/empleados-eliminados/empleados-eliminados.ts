import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpleadoEliminado } from '../../core/models/empleado-eliminado.model';
import { Api } from '../../core/services/api';
import { Usuario } from '../../core/models/usuario.model';
import { Auth } from '../../core/services/auth';
import { ROLES } from '../../core/constants/constantes';

@Component({
  selector: 'app-empleados-eliminados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empleados-eliminados.html',
  styleUrls: ['./empleados-eliminados.css']
})
export class EmpleadosEliminados implements OnInit {
  empleados: EmpleadoEliminado[] = [];
  cargando = false;
  error: string | null = null;

  currentUser: Usuario | null = null;
  readonly ROLES = ROLES;

  constructor(private api: Api, private authService: Auth) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUserData();
    if (!this.currentUser) {
      this.error = 'No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.';
      this.authService.logout();
      return;
    }

    if (this.puedeVerEliminados()) {
      this.cargarEmpleadosEliminados();
    } else {
      this.error = 'Acceso denegado. No tienes permisos para ver empleados eliminados.';
    }
  }

  /** Control de roles: solo ciertos roles pueden ver empleados eliminados */
  puedeVerEliminados(): boolean {
    if (!this.currentUser) return false;
    const rolesPermitidos = [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_STATE,
      ROLES.ADMIN_MUNICIPAL,
      ROLES.ADMIN_CIRCUITAL,
      ROLES.ADMIN_SQUAD
      // 👆 aquí defines qué roles tienen acceso al histórico
    ];
    return rolesPermitidos.includes(this.currentUser.cod_rol);
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
    if (!this.puedeRestaurar()) {
      this.error = 'Acceso denegado. No tienes permisos para restaurar empleados.';
      return;
    }

    this.api.restoreEmpleado(id).subscribe({
      next: (resp) => {
        this.error = resp.msg; // Mensaje de éxito
        this.cargarEmpleadosEliminados();
      },
      error: () => {
        this.error = 'Error al restaurar empleado';
      }
    });
  }

  /** Control de roles: quién puede restaurar */
  puedeRestaurar(): boolean {
    if (!this.currentUser) return false;
    const rolesPermitidos = [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_SQUAD
      // 👆 aquí defines qué roles pueden restaurar
    ];
    return rolesPermitidos.includes(this.currentUser.cod_rol);
  }
}
