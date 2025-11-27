import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// Importar los servicios y modelos necesarios
import { Usuario } from '../../../../core/models/usuario.model';
import { Api } from '../../../../core/services/api';
import { Auth } from '../../../../core/services/auth';
import { ROLES } from '../../../../core/constants/constantes';

@Component({
  selector: 'app-usuario-director',
  imports: [CommonModule],
  templateUrl: './usuario-director.html',
  styleUrl: './usuario-director.css',
})
export class UsuarioDirector implements OnInit, OnDestroy {
  usuarios: Usuario[] = []; // Almacena la lista de usuarios activos/aprobados (para la tabla principal)
  pendingUsuarios: Usuario[] = []; // Almacena la lista de usuarios con rol PENDING (para la tabla de aprobación)
  isLoading: boolean = false; // Indicador de estado de carga de datos

  errorMessage: string | null = null; // Mensaje de error general para la tabla principal
  approvalMessage: string | null = null; // Mensaje específico para la sección de aprobación de usuarios
  approvalMessageType: 'success' | 'danger' | 'warning' | null = null; // Tipo de mensaje (para estilos de alerta Bootstrap)

  private dataSubscription: Subscription | undefined; // Suscripción para gestionar la cancelación de peticiones HTTP

  // Propiedades para el control de permisos y filtrado de usuarios basado en el ámbito del usuario logueado
  currentUserRole: number | null = null;
  currentUserStateId: number | null = null;
  currentUserMunicipalId: number | null = null;
  currentUserCircuitoId: number | null = null; // id_circuito_asignado del usuario logueado
  currentUserPlantelId: string | null = null;

  constructor(
    private apiService: Api,
    private authService: Auth,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (userData) {
      this.currentUserRole = userData.cod_rol;
      this.currentUserStateId = userData.id_estado_asignado || null;
      this.currentUserMunicipalId = userData.id_municipio_asignado || null;
      this.currentUserCircuitoId = userData.id_circuito_asignado || null; // Usar id_circuito_asignado
      this.currentUserPlantelId = userData.codigo_plantel_asignado || null;


    } else {
      // Si no hay datos de usuario (no logueado), redirigir a la página de login
      this.router.navigate(['/login']);
      return;
    }

    // Llamar al método para obtener y filtrar los usuarios al inicializar el componente
    this.getUsuarios();
  }

  ngOnDestroy(): void {
    // Asegurarse de desuscribirse de las suscripciones para evitar fugas de memoria
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  /**
   * Determina si el rol actual del usuario tiene permiso para ver y gestionar la sección de usuarios pendientes.
   * Solo los roles con capacidad de administración pueden ver esta sección.
   * @returns `true` si el usuario puede ver la sección de pendientes, `false` en caso contrario.
   */
  canSeePendingSection(): boolean {
    const rolesWithPendingManagement = [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_STATE,
      ROLES.ADMIN_MUNICIPAL,
      ROLES.ADMIN_CIRCUITAL,
      ROLES.ADMIN_SQUAD
    ];
    return this.currentUserRole !== null && rolesWithPendingManagement.includes(this.currentUserRole);
  }

  /**
   * Obtiene la lista completa de usuarios del backend y aplica filtros en el frontend
   * según el rol del usuario logueado y su ámbito de gestión.
   */
  getUsuarios(): void {
    this.isLoading = true; // Activar el indicador de carga
    this.errorMessage = null; // Limpiar mensajes de error previos
    this.approvalMessage = null; // Limpiar mensajes de aprobación previos
    this.approvalMessageType = null;

    this.dataSubscription = this.apiService.getUsuarios()
      .pipe(
        catchError(error => {
          // Manejo de errores durante la carga de usuarios
          this.errorMessage = 'No se pudieron cargar los usuarios. Por favor, verifica tu conexión o la URL de la API.';
          if (error.status === 401) {
            this.errorMessage = 'Sesión expirada o no autorizado. Por favor, inicia sesión de nuevo.';
            this.authService.logout(); // Redirigir a login si la sesión ha expirado
          } else if (error.status === 404) {
            this.errorMessage = 'El recurso de usuarios no fue encontrado en el servidor. Verifica la ruta en la API.';
          } else {
            this.errorMessage = `Error: ${error.message || 'Error de servidor desconocido'}. Código: ${error.status || 'N/A'}`;
          }
          console.error('DEBUG (getUsuarios): Error completo al cargar usuarios:', error);
          return of([]); // Retornar un observable vacío para evitar que la aplicación falle
        }),
        finalize(() => {
          this.isLoading = false; // Desactivar el indicador de carga al finalizar la petición
        })
      )
      .subscribe(allFetchedUsuarios => {
        this.usuarios = []; // Limpiar lista de usuarios activos
        this.pendingUsuarios = []; // Limpiar lista de usuarios pendientes


        if (!allFetchedUsuarios || allFetchedUsuarios.length === 0) {
          this.errorMessage = 'No se encontraron usuarios en el sistema que coincidan con tu ámbito.';

          return;
        }

        // Separar usuarios activos (cualquier rol distinto de PENDING) de los pendientes (solo rol PENDING)
        const allActive = allFetchedUsuarios.filter(u => u.cod_rol !== ROLES.PENDING);
        const allPending = allFetchedUsuarios.filter(u => u.cod_rol === ROLES.PENDING);

        // Aplicar la lógica de filtrado específica según el rol del usuario logueado
        if (this.currentUserRole === ROLES.SUPER_ADMIN) {
          // SUPER_ADMIN ve todos los usuarios activos y todos los pendientes.
          this.usuarios = allActive;
          this.pendingUsuarios = allPending;
        } else if (this.currentUserRole === ROLES.ADMIN_STATE && this.currentUserStateId !== null) {
          // ADMIN_STATE ve usuarios activos de su estado y pendientes con rol sugerido ADMIN_MUNICIPAL de su estado.
          this.usuarios = allActive.filter(u =>
            u.id_estado_asignado === this.currentUserStateId
          );
          this.pendingUsuarios = allPending.filter(u => {
            const isStateMatch = u.id_estado_sugerido === this.currentUserStateId;
            const isRoleMatch = u.cod_rol_sugerido === ROLES.ADMIN_MUNICIPAL;
            const isMatch = isStateMatch && isRoleMatch;
            return isMatch;
          });
        }
        else if (this.currentUserRole === ROLES.ADMIN_MUNICIPAL && this.currentUserMunicipalId !== null) {
          // ADMIN_MUNICIPAL ve usuarios activos de su municipio y pendientes con rol sugerido ADMIN_CIRCUITAL de su municipio.
          this.usuarios = allActive.filter(u =>
            u.id_municipio_asignado === this.currentUserMunicipalId
          );
          this.pendingUsuarios = allPending.filter(u => {
            const isStateMatch = u.id_estado_sugerido === this.currentUserStateId;
            const isMunicipalMatch = u.id_municipio_sugerido === this.currentUserMunicipalId;
            const isRoleMatch = u.cod_rol_sugerido === ROLES.ADMIN_CIRCUITAL;
            const isMatch = isStateMatch && isMunicipalMatch && isRoleMatch;
            return isMatch;
          });
        }
        else if (this.currentUserRole === ROLES.ADMIN_CIRCUITAL && this.currentUserCircuitoId !== null) {
          // ADMIN_CIRCUITAL ve usuarios activos de su circuito y pendientes con rol sugerido ADMIN_SQUAD de su circuito.
          this.usuarios = allActive.filter(u =>
            u.id_circuito_asignado === this.currentUserCircuitoId
          );
          this.pendingUsuarios = allPending.filter(u => {
            const isStateMatch = u.id_estado_sugerido === this.currentUserStateId;
            const isMunicipalMatch = u.id_municipio_sugerido === this.currentUserMunicipalId;
            const isCircuitalMatch = u.id_circuito_sugerido === this.currentUserCircuitoId; // Usar id_circuito_sugerido
            const isRoleMatch = u.cod_rol_sugerido === ROLES.ADMIN_SQUAD;
            const isMatch = isStateMatch && isMunicipalMatch && isCircuitalMatch && isRoleMatch;
            return isMatch;
          });
        }
        else if (this.currentUserRole === ROLES.ADMIN_SQUAD && this.currentUserPlantelId !== null) {
          // ADMIN_SQUAD ve usuarios activos de su plantel y pendientes con rol sugerido STANDARD de su plantel.
          this.usuarios = allActive.filter(u =>
            u.codigo_plantel_asignado === this.currentUserPlantelId
          );
          this.pendingUsuarios = allPending.filter(u => {
            const isStateMatch = u.id_estado_sugerido === this.currentUserStateId;
            const isMunicipalMatch = u.id_municipio_sugerido === this.currentUserMunicipalId;
            const isCircuitalMatch = u.id_circuito_sugerido === this.currentUserCircuitoId;
            const isPlantelMatch = u.codigo_plantel_sugerido === this.currentUserPlantelId;
            const isRoleMatch = u.cod_rol_sugerido === ROLES.STANDARD;
            const isMatch = isStateMatch && isMunicipalMatch && isCircuitalMatch && isPlantelMatch && isRoleMatch;
            return isMatch;
          });
        }
        else {
          // Caso por defecto: el rol del usuario no tiene permisos para gestionar usuarios en esta sección.
          this.errorMessage = 'Tu rol actual no tiene permisos para ver o gestionar esta tabla de usuarios o aprobaciones.';
          this.usuarios = [];
          this.pendingUsuarios = [];
        }

        // Verificar el estado de los usuarios pendientes y mostrar un mensaje informativo si no hay solicitudes.
        this.checkPendingStatusAndShowMessage();

        // Mostrar mensaje si no se encontraron usuarios activos o pendientes después de todos los filtros.
        if (this.usuarios.length === 0 && this.pendingUsuarios.length === 0 && !this.errorMessage) {
          this.errorMessage = 'No se encontraron usuarios que coincidan con tu ámbito de gestión después de aplicar los filtros.';
        }
      });
  }

  // --- MÉTODOS DE ACCIÓN PARA LA TABLA PRINCIPAL DE USUARIOS ---

  /**
   * Navega a la pantalla de añadir un nuevo usuario.
   * Solo accesible para SUPER_ADMIN en esta sección.
   */
  addUsuario(): void {
    if (this.currentUserRole === ROLES.SUPER_ADMIN) {
      this.router.navigate(['empleados/nuevoRegistro'], { relativeTo: this.activatedRoute.parent?.parent?.parent });
    } else {
      this.mostrarMensajeGeneral('La funcionalidad de añadir usuario no está disponible para tu rol en esta sección.', 'warning');
    }
  }

  /**
   * Navega a la pantalla de edición de un usuario existente.
   * @param usuario El objeto Usuario a editar.
   */
  editUsuario(usuario: Usuario): void {
    this.router.navigate(['editar', usuario.id_usuario], { relativeTo: this.activatedRoute });
  }

  /**
   * Solicita la eliminación de un usuario activo.
   * @param usuario El objeto Usuario a eliminar.
   */
  deleteUsuario(usuario: Usuario): void {
    // Es recomendable reemplazar 'confirm()' por un modal de confirmación personalizado en un entorno de producción.
    if (confirm(`¿Estás seguro de que quieres eliminar a ${usuario.nombre} ${usuario.apellido}? Esta acción es irreversible.`)) {
      this.apiService.deleteUsuario(usuario.id_usuario!).pipe(
        catchError(error => {
          this.mostrarMensajeGeneral(`Error al eliminar usuario: ${error.message || 'Error desconocido del servidor'}.`, 'danger');
          return of(null); // Retorna un observable vacío en caso de error
        })
      ).subscribe(response => {
        if (response) {
          this.mostrarMensajeGeneral(`Usuario ${usuario.nombre} ${usuario.apellido} eliminado exitosamente.`, 'success');
          this.getUsuarios(); // Recargar la lista de usuarios para reflejar el cambio
        }
      });
    }
  }

  // --- MÉTODOS DE ACCIÓN PARA LA TABLA DE USUARIOS PENDIENTES ---

  /**
   * Ignora (elimina) una solicitud de registro de un usuario pendiente.
   * @param usuario El usuario pendiente a ignorar y eliminar.
   */
  ignoreUser(usuario: Usuario): void {
    // Es recomendable reemplazar 'confirm()' por un modal de confirmación personalizado.
    if (confirm(`¿Estás seguro de que quieres IGNORAR (eliminar) la solicitud de ${usuario.nombre} ${usuario.apellido}? Esta acción es irreversible.`)) {
      this.apiService.deleteUsuario(usuario.id_usuario!).pipe(
        catchError(error => {
          this.mostrarMensajeAprobacion(`Error al ignorar la solicitud: ${error.message || 'Error desconocido del servidor'}.`, 'danger');
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          this.mostrarMensajeAprobacion(`Solicitud de ${usuario.nombre} ${usuario.apellido} ignorada y eliminada.`, 'success');
          this.getUsuarios(); // Recargar la lista para reflejar los cambios
        }
      });
    }
  }

  /**
   * Aprueba un usuario pendiente, asignándole su rol y datos geográficos sugeridos.
   * @param usuario El usuario pendiente a aprobar.
   */
  approveUser(usuario: Usuario): void {
    // Es recomendable reemplazar 'confirm()' por un modal de confirmación personalizado.
    if (confirm(`¿Estás seguro de que quieres APROBAR a ${usuario.nombre} ${usuario.apellido} con el rol ${this.getRoleName(usuario.cod_rol_sugerido || 0)}?`)) {
      const updatedUser: Partial<Usuario> = {
        id_usuario: usuario.id_usuario,
        cod_rol: usuario.cod_rol_sugerido || ROLES.STANDARD, // Asignar el rol sugerido
        id_estado_asignado: usuario.id_estado_sugerido,
        id_municipio_asignado: usuario.id_municipio_sugerido,
        id_circuito_asignado: usuario.id_circuito_sugerido, // Asignar id_circuito_sugerido a id_circuito_asignado
        codigo_plantel_asignado: usuario.codigo_plantel_sugerido,

        // Limpiar los campos de sugerencia después de la aprobación
        cod_rol_sugerido: null,
        id_estado_sugerido: null,
        id_municipio_sugerido: null,
        id_circuito_sugerido: null, // Limpiar id_circuito_sugerido
        codigo_plantel_sugerido: null,
      };

      this.apiService.updateUsuario(usuario.id_usuario!, updatedUser).pipe(
        catchError(error => {
          this.mostrarMensajeAprobacion(`Error al aprobar la solicitud: ${error.message || 'Error desconocido del servidor'}.`, 'danger');
          return of(null);
        })
      ).subscribe(response => {
        if (response && response.msg) {
          this.mostrarMensajeAprobacion(`Usuario ${usuario.nombre} ${usuario.apellido} aprobado y rol asignado.`, 'success');
          this.getUsuarios(); // Recargar la lista para mostrar el usuario como activo
        }
      });
    }
  }

  /**
   * Muestra un mensaje temporal en la parte superior de la tabla de usuarios activos.
   * @param mensaje El texto del mensaje.
   * @param tipo El tipo de alerta (ej. 'success', 'danger', 'warning').
   */
  mostrarMensajeGeneral(mensaje: string, tipo: 'success' | 'danger' | 'warning'): void {
    this.errorMessage = mensaje;
    setTimeout(() => {
      this.errorMessage = null;
    }, 5000); // El mensaje desaparece después de 5 segundos
  }

  /**
   * Muestra un mensaje temporal específico en la sección de usuarios pendientes.
   * @param mensaje El texto del mensaje.
   * @param tipo El tipo de alerta (ej. 'success', 'danger', 'warning').
   */
  mostrarMensajeAprobacion(mensaje: string, tipo: 'success' | 'danger' | 'warning'): void {
    this.approvalMessage = mensaje;
    this.approvalMessageType = tipo;
    setTimeout(() => {
      this.approvalMessage = null;
      this.approvalMessageType = null;
    }, 5000); // El mensaje desaparece después de 5 segundos
  }

  /**
   * Verifica si hay usuarios pendientes y muestra un mensaje informativo si no hay.
   */
  checkPendingStatusAndShowMessage(): void {
    if (this.pendingUsuarios.length === 0 && this.canSeePendingSection()) {
      this.approvalMessage = 'No hay solicitudes de nuevos usuarios pendientes de aprobación en tu ámbito de gestión.';
      this.approvalMessageType = 'warning';
    } else if (this.pendingUsuarios.length > 0) {
      // Si hay pendientes, limpiar cualquier mensaje previo que diga que no hay.
      this.approvalMessage = null;
      this.approvalMessageType = null;
    }
  }

  /**
   * Navega de vuelta al panel de tablas de base de datos o a la ruta de control general.
   * La ruta de navegación es relativa y se ajusta a la URL actual.
   */
  goToDbTables(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/dashboard/control/db/usuarios')) {
      this.router.navigate(['../../'], { relativeTo: this.activatedRoute });
    } else if (currentUrl.includes('/dashboard/control/estadal/usuarios')) {
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } else {
      this.router.navigate(['/dashboard/control']);
    }
  }

  /**
   * Convierte un ID de rol numérico a su nombre legible.
   * @param roleId El ID numérico del rol.
   * @returns El nombre del rol (ej. "SUPER ADMIN") o "Desconocido" si no se encuentra.
   */
  getRoleName(roleId: number): string {
    for (const [key, value] of Object.entries(ROLES)) {
      if (value === roleId) {
        // Formatear el nombre del rol (ej. "ADMIN_STATE" a "ADMIN STATE")
        return key.replace(/_/g, ' ');
      }
    }
    return 'Desconocido';
  }
}
