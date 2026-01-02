import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, of, forkJoin } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { BackendMessageResponse, Usuario } from '../../core/models/usuario.model';
import { Estado } from '../../core/models/estado.model';
import { Municipio } from '../../core/models/municipio.model';
import { Circuito } from '../../core/models/circuito.model';
import { Plantel } from '../../core/models/plantel.model';
import { Api } from '../../core/services/api';
import { Auth } from '../../core/services/auth';
import { ROLES } from '../../core/constants/constantes';


@Component({
  selector: 'app-autorizacion',
  imports: [
    CommonModule,
    FormsModule],
  templateUrl: './autorizacion.html',
  styleUrl: './autorizacion.css',
})
export class Autorizacion implements OnInit, OnDestroy {
  // --- Propiedades para la Tabla de Autorización Directa (AdminEstadal) ---
  adminEstadalPendientes: Usuario[] = [];
  isLoadingAdminEstadal: boolean = false;
  adminEstadalMessage: string | null = null;
  adminEstadalMessageType: 'success' | 'danger' | 'warning' | null = null;

  // Filtros para AdminEstadal (Solo Estado)
  estadosFiltroAdminEstadal: Estado[] = [];
  selectedEstadoAdminEstadal: number | null = null;

  // --- Propiedades para la Tabla de Monitoreo (Roles Inferiores) ---
  monitoreoPendientes: Usuario[] = [];
  isLoadingMonitoreo: boolean = false;
  monitoreoMessage: string | null = null;
  monitoreoMessageType: 'success' | 'danger' | 'warning' | null = null;

  // Filtros para Monitoreo (Estado, Municipio, Circuito, Plantel, Tipo de Rol)
  estadosFiltroMonitoreo: Estado[] = [];
  selectedEstadoMonitoreo: number | null = null;
  municipiosFiltroMonitoreo: Municipio[] = [];
  selectedMunicipioMonitoreo: number | null = null;
  circuitosFiltroMonitoreo: Circuito[] = [];
  selectedCircuitoMonitoreo: number | null = null;
  plantelesFiltroMonitoreo: Plantel[] = [];
  selectedPlantelMonitoreo: string | null = null;
  tiposRolFiltroMonitoreo: { id: number; nombre: string }[] = [];
  selectedTipoRolMonitoreo: number | null = null;

  // --- Propiedades Compartidas ---
  private dataSubscription: Subscription | undefined;
  currentUserRole: number | null = null;
  currentUserData: Usuario | null = null; // Almacena los datos del usuario logueado, incluyendo su ubicación asignada

  // --- Panel Lateral ---
  showSidePanel: boolean = false;
  selectedUser: Usuario | null = null;

  // --- Modal de Confirmación ---
  showConfirmModal: boolean = false;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalAction: 'approve' | 'reject' | null = null;

  constructor(
    private apiService: Api,
    private authService: Auth,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  private readonly CONFIGURACION_POR_ROL: Record<number, {
    titulo: string;
    rolAutorizado: number;
    monitoreoInferiores: number[];
  }> = {
      [ROLES.SUPER_ADMIN]: {
        titulo: 'Estadales',
        rolAutorizado: ROLES.ADMIN_STATE,
        monitoreoInferiores: [ROLES.ADMIN_MUNICIPAL, ROLES.ADMIN_CIRCUITAL, ROLES.ADMIN_SQUAD, ROLES.STANDARD]
      },
      [ROLES.ADMIN_STATE]: {
        titulo: 'Municipales',
        rolAutorizado: ROLES.ADMIN_MUNICIPAL,
        monitoreoInferiores: [ROLES.ADMIN_CIRCUITAL, ROLES.ADMIN_SQUAD, ROLES.STANDARD]
      },
      [ROLES.ADMIN_MUNICIPAL]: {
        titulo: 'Circuitales',
        rolAutorizado: ROLES.ADMIN_CIRCUITAL,
        monitoreoInferiores: [ROLES.ADMIN_SQUAD, ROLES.STANDARD]
      },
      [ROLES.ADMIN_CIRCUITAL]: {
        titulo: 'Directores de Plantel',
        rolAutorizado: ROLES.ADMIN_SQUAD,
        monitoreoInferiores: [ROLES.STANDARD]
      },
      [ROLES.ADMIN_SQUAD]: {
        titulo: 'Secretarios',
        rolAutorizado: ROLES.STANDARD,
        monitoreoInferiores: []
      },
      [ROLES.STANDARD]: {
        titulo: 'Autorización de Usuarios del Plantel',
        rolAutorizado: ROLES.STANDARD,
        monitoreoInferiores: []
      }
    };

  configuracionRol: {
    titulo: string;
    rolAutorizado: number;
    monitoreoInferiores: number[];
  } | null = null;

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (userData) {
      this.currentUserRole = userData.cod_rol;
      this.currentUserData = userData; // Guardar datos de ubicación para el filtro de alcance
      const config = this.CONFIGURACION_POR_ROL[this.currentUserRole];
      if (!config) {
        this.router.navigate(['/acceso-denegado']);
        return;
      }
      this.configuracionRol = config;

    } else {
      this.router.navigate(['/login']);
      return;
    }

    this.loadFilterOptions();
    this.loadAllPendingUsers();
  }

  ngOnDestroy(): void {
    this.dataSubscription?.unsubscribe();
  }

  /**
   * Carga las opciones para los selectores de filtros (Estados, Tipos de Rol).
   */
  loadFilterOptions(): void {
    this.apiService.getEstados().subscribe({
      next: (data) => {
        this.estadosFiltroAdminEstadal = data;
        this.estadosFiltroMonitoreo = data;
      },
      error: (err) => console.error('Error al cargar estados para filtros:', err)
    });

    // Cargar tipos de rol para el filtro de monitoreo
    this.tiposRolFiltroMonitoreo = (this.configuracionRol?.monitoreoInferiores || []).map(id => ({
      id,
      nombre: this.getRoleName(id)
    }));

  }

  /**
   * Carga todos los usuarios pendientes del sistema y los distribuye en las tablas.
   */
  // MÉTODO AFECTADO: loadAllPendingUsers (Reemplazo completo)

  // Asegúrate de que tienes 'map' importado de 'rxjs/operators' en este componente:
  // import { catchError, finalize, map, of } from 'rxjs/operators'; // Los imports deben estar aquí

  loadAllPendingUsers(): void {
    this.isLoadingAdminEstadal = true;
    this.isLoadingMonitoreo = true;
    this.adminEstadalMessage = null;
    this.monitoreoMessage = null;

    this.dataSubscription = this.apiService.getUsuarios()
      .pipe(
        // SOLUCIÓN 1: Usamos 'map' para extraer el array 'users' del objeto respuesta.
        // Esto normaliza la salida del pipe a Observable<Usuario[]>.
        // Usamos 'any' en la entrada del map para evitar conflictos de tipado 
        // ya que el servicio promete 'Usuario[]' pero devuelve el objeto contenedor.
        map((response: any) => {
          // Aseguramos que 'response' exista y que contenga la propiedad 'users'.
          return response && response.users ? response.users : [];
        }),

        catchError(error => {
          this.adminEstadalMessage = 'Error al cargar usuarios pendientes.';
          this.monitoreoMessage = 'Error al cargar usuarios para monitoreo.';
          console.error('Error:', error);
          // SOLUCIÓN 2: Devolvemos 'of([])'. Como la salida del pipe ya es Usuario[] (gracias al map),
          // no hay conflicto de tipos.
          return of([]);
        }),

        finalize(() => {
          this.isLoadingAdminEstadal = false;
          this.isLoadingMonitoreo = false;
        })
      )
      .subscribe((allUsers: Usuario[]) => { // allUsers ahora es definitivamente un array de Usuario[]

        // ESTE FILTRADO AHORA FUNCIONA: allUsers es un array y tiene el método .filter
        const allPending = allUsers.filter(u => u.cod_rol === ROLES.PENDING);
        const rolAutorizadoDirecto = this.configuracionRol?.rolAutorizado;
        const ROL_A_EXCLUIR_DE_MONITOREO = 2; // Admin State

        // ----------------------------------------------------------------
        // PASO 1: EXTRAER VARIABLES DE ALCANCE DEL USUARIO LOGUEADO
        // ----------------------------------------------------------------
        const idEstadoAsignado = this.currentUserData?.id_estado_asignado || null;
        const idMunicipioAsignado = this.currentUserData?.id_municipio_asignado || null;
        const idCircuitoAsignado = this.currentUserData?.id_circuito_asignado || null;
        const codigoPlantelAsignado = this.currentUserData?.codigo_plantel_asignado || null;
        // ----------------------------------------------------------------


        // ----------------------------------------------------------------
        // 1. Filtrar para la Tabla de Autorización Directa (AdminEstadal)
        // ----------------------------------------------------------------
        this.adminEstadalPendientes = allPending.filter(u => {
          const isAutorizable = u.cod_rol_sugerido === rolAutorizadoDirecto;

          // **NUEVO FILTRO:** Aplicar el control de alcance geográfico
          const hasGeographicScope = this.checkGeographicScope(
            u,
            idEstadoAsignado,
            idMunicipioAsignado,
            idCircuitoAsignado,
            codigoPlantelAsignado
          );

          const selectedEstadoAdminEstadalNum = (this.selectedEstadoAdminEstadal !== null && this.selectedEstadoAdminEstadal !== undefined) ? Number(this.selectedEstadoAdminEstadal) : null;
          const matchesEstado = selectedEstadoAdminEstadalNum === null || u.id_estado_sugerido === selectedEstadoAdminEstadalNum;

          // Se requiere: ser el rol correcto, estar en el alcance del admin Y cumplir el filtro de Estado.
          const shouldInclude = isAutorizable && hasGeographicScope && matchesEstado;

          return shouldInclude;
        });

        if (this.adminEstadalPendientes.length === 0) {
          this.adminEstadalMessage = `No hay solicitudes pendientes de ${this.getRoleName(rolAutorizadoDirecto || 0)}.`;
          this.adminEstadalMessageType = 'warning';
        } else {
          this.adminEstadalMessage = null;
        }

        // ----------------------------------------------------------------
        // 2. Filtrar para la Tabla de Monitoreo (Roles Inferiores)
        // ----------------------------------------------------------------
        this.monitoreoPendientes = allPending
          .filter(u => {
            // Check 1: ¿Es un rol de monitoreo inferior permitido?
            const isMonitoreoRole = this.configuracionRol?.monitoreoInferiores.includes(u.cod_rol_sugerido || -1);

            // Check 2: EXCLUSIÓN del ROL 2 y Rol de Autorización Directa (se mantienen)
            const isNotRoleTwo = u.cod_rol_sugerido !== ROL_A_EXCLUIR_DE_MONITOREO;
            const isNotDirectlyAutorizable = u.cod_rol_sugerido !== rolAutorizadoDirecto;

            // **NUEVO FILTRO:** Aplicar el control de alcance geográfico
            const hasGeographicScope = this.checkGeographicScope(
              u,
              idEstadoAsignado,
              idMunicipioAsignado,
              idCircuitoAsignado,
              codigoPlantelAsignado
            );

            // ... (Filtros geográficos y de rol de la tabla) ...
            const selectedEstadoMonitoreoNum = (this.selectedEstadoMonitoreo !== null && this.selectedEstadoMonitoreo !== undefined) ? Number(this.selectedEstadoMonitoreo) : null;
            const selectedMunicipioMonitoreoNum = (this.selectedMunicipioMonitoreo !== null && this.selectedMunicipioMonitoreo !== undefined) ? Number(this.selectedMunicipioMonitoreo) : null;
            const selectedCircuitoMonitoreoNum = (this.selectedCircuitoMonitoreo !== null && this.selectedCircuitoMonitoreo !== undefined) ? Number(this.selectedCircuitoMonitoreo) : null;

            const matchesEstado = selectedEstadoMonitoreoNum === null || u.id_estado_sugerido === selectedEstadoMonitoreoNum;
            const matchesMunicipio = selectedMunicipioMonitoreoNum === null || u.id_municipio_sugerido === selectedMunicipioMonitoreoNum;
            const matchesCircuito = selectedCircuitoMonitoreoNum === null || u.id_circuito_sugerido === selectedCircuitoMonitoreoNum;
            const matchesPlantel = this.selectedPlantelMonitoreo === null || u.codigo_plantel_sugerido === this.selectedPlantelMonitoreo;
            const matchesTipoRol = this.selectedTipoRolMonitoreo === null || u.cod_rol_sugerido === this.selectedTipoRolMonitoreo;

            // Resultado final: Debe ser monitoreable, no excluido, estar en el alcance geográfico Y cumplir los filtros de la tabla.
            const shouldInclude = isMonitoreoRole && isNotRoleTwo && isNotDirectlyAutorizable && hasGeographicScope && matchesEstado && matchesMunicipio && matchesCircuito && matchesPlantel && matchesTipoRol;

            return shouldInclude;
          })
          .map(u => ({
            ...u,
            rolSugeridoNombre: this.getRoleName(u.cod_rol_sugerido || 0),
            ubicacionCompleta: this.getCompleteLocation(u),
            rolAutorizadorNombre: this.getRoleName(this.getApproverRole(u.cod_rol_sugerido || 0) || 0)
          }));

        if (this.monitoreoPendientes.length === 0) {
          this.monitoreoMessage = 'No hay solicitudes pendientes de roles inferiores para monitorear.';
          this.monitoreoMessageType = 'warning';
        } else {
          this.monitoreoMessage = null;
        }
      });
  }

  // --- Lógica de Filtros Dinámicos para la Tabla de Monitoreo --- 
  onEstadoMonitoreoChange(): void {
    this.selectedMunicipioMonitoreo = null;
    this.municipiosFiltroMonitoreo = [];
    this.selectedCircuitoMonitoreo = null;
    this.circuitosFiltroMonitoreo = [];
    this.selectedPlantelMonitoreo = null;
    this.plantelesFiltroMonitoreo = [];

    const estadoIdNum = (this.selectedEstadoMonitoreo !== null && this.selectedEstadoMonitoreo !== undefined) ? Number(this.selectedEstadoMonitoreo) : null;

    if (estadoIdNum) {
      this.apiService.getMunicipios(estadoIdNum).subscribe({
        next: (data) => this.municipiosFiltroMonitoreo = data,
        error: (err) => console.error('Error al cargar municipios para filtro:', err)
      });
    }
    this.loadAllPendingUsers();
  }

  onMunicipioMonitoreoChange(): void {
    this.selectedCircuitoMonitoreo = null;
    this.circuitosFiltroMonitoreo = [];
    this.selectedPlantelMonitoreo = null;
    this.plantelesFiltroMonitoreo = [];

    const municipioIdNum = (this.selectedMunicipioMonitoreo !== null && this.selectedMunicipioMonitoreo !== undefined) ? Number(this.selectedMunicipioMonitoreo) : null;

    if (municipioIdNum) {
      forkJoin([
        this.apiService.getCircuitosPorMunicipio(municipioIdNum),
        this.apiService.getPlanteles(municipioIdNum)
      ]).subscribe({
        next: ([circuitos, planteles]) => {
          this.circuitosFiltroMonitoreo = circuitos;
          this.plantelesFiltroMonitoreo = planteles;
        },
        error: (err) => console.error('Error al cargar circuitos/planteles para filtro:', err)
      });
    }
    //console.log('Municipio seleccionado:', this.selectedMunicipioMonitoreo);
    //console.log('Circuitos cargados:', this.circuitosFiltroMonitoreo.length);
    this.loadAllPendingUsers();
  }

  onCircuitoMonitoreoChange(): void {
    this.selectedPlantelMonitoreo = null;
    this.plantelesFiltroMonitoreo = [];

    const circuitoIdNum = (this.selectedCircuitoMonitoreo !== null && this.selectedCircuitoMonitoreo !== undefined) ? Number(this.selectedCircuitoMonitoreo) : null;
    const municipioIdNum = (this.selectedMunicipioMonitoreo !== null && this.selectedMunicipioMonitoreo !== undefined) ? Number(this.selectedMunicipioMonitoreo) : null;


    if (circuitoIdNum) {
      if (municipioIdNum) {
        this.apiService.getPlanteles(municipioIdNum).subscribe({
          next: (data) => {
            this.plantelesFiltroMonitoreo = data.filter(p => p.id_circuito === circuitoIdNum);
          },
          error: (err) => console.error('Error al cargar planteles por circuito para filtro:', err)
        });
      }
    } else if (municipioIdNum) {
      this.apiService.getPlanteles(municipioIdNum).subscribe({
        next: (data) => this.plantelesFiltroMonitoreo = data,
        error: (err) => console.error('Error al cargar planteles para filtro (sin circuito):', err)
      });
    }
    this.loadAllPendingUsers();
  }


  onPlantelMonitoreoChange(): void {
    this.loadAllPendingUsers();
  }

  onTipoRolMonitoreoChange(): void {
    this.loadAllPendingUsers();
  }

  onEstadoAdminEstadalChange(): void {
    this.loadAllPendingUsers();
  }

  // --- Lógica del Panel Lateral y Modal ---
  openSidePanel(user: Usuario): void {
    this.selectedUser = user;
    this.showSidePanel = true;
  }

  closeSidePanel(): void {
    this.showSidePanel = false;
    this.selectedUser = null;
  }

  openConfirmModal(action: 'approve' | 'reject', user: Usuario): void {
    this.selectedUser = user;
    this.confirmModalAction = action;
    if (action === 'approve') {
      this.confirmModalTitle = `Aprobar Solicitud`;
      this.confirmModalMessage = `¿Estás seguro de APROBAR a ${user.nombre} ${user.apellido} como ${this.getRoleName(user.cod_rol_sugerido || 0)}?`;
    } else {
      this.confirmModalTitle = `Rechazar Solicitud`;
      this.confirmModalMessage = `¿Estás seguro de RECHAZAR y ELIMINAR la solicitud de ${user.nombre} ${user.apellido}? Esta acción es irreversible.`;
    }
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmModalTitle = '';
    this.confirmModalMessage = '';
    this.confirmModalAction = null;
  }

  confirmActionExecute(): void {
    if (!this.selectedUser) return;

    if (this.confirmModalAction === 'approve') {
      this.approveUser(this.selectedUser);
    } else if (this.confirmModalAction === 'reject') {
      this.rejectUser(this.selectedUser);
    }
    this.closeConfirmModal();
  }

  // --- Métodos de Acción de Autorización (solo para AdminEstadal) ---
  approveUser(usuario: Usuario): void {
    if (!usuario.id_usuario) {
      this.mostrarMensajeAdmin('Error: ID de usuario no disponible para aprobación.', 'danger');
      return;
    }

    const updatedUser: Partial<Usuario> = {
      id_usuario: usuario.id_usuario,
      // Asignación de Rol
      cod_rol: usuario.cod_rol_sugerido || ROLES.STANDARD,

      // Mapeo de Ubicación: de Sugerido a Asignado
      id_estado_asignado: usuario.id_estado_sugerido,
      id_municipio_asignado: usuario.id_municipio_sugerido,
      id_circuito_asignado: usuario.id_circuito_sugerido,
      codigo_plantel_asignado: usuario.codigo_plantel_sugerido,

      // Limpieza de campos de solicitud (para que deje de ser pendiente)
      cod_rol_sugerido: null,
      id_estado_sugerido: null,
      id_municipio_sugerido: null,
      id_circuito_sugerido: null,
      codigo_plantel_sugerido: null,

      fecha_aprobacion: new Date().toISOString().split('T')[0]
    };

    this.apiService.updateUsuario(usuario.id_usuario, updatedUser)
      .pipe(
        catchError((err: BackendMessageResponse) => {
          this.mostrarMensajeAdmin(`Error al aprobar solicitud: ${err.msg || 'Error desconocido.'}`, 'danger');
          return of(null);
        }),
        finalize(() => this.closeSidePanel())
      )
      .subscribe(() => { // Removida a verificação 'response'
        this.mostrarMensajeAdmin(`Usuario ${usuario.nombre} aprobado como ${this.getRoleName(usuario.cod_rol_sugerido || 0)}. Correo enviado.`, 'success');
        this.loadAllPendingUsers();
      });
  }

  rejectUser(usuario: Usuario): void {
    if (!usuario.id_usuario) {
      this.mostrarMensajeAdmin('Error: ID de usuario no disponible para rechazo.', 'danger');
      return;
    }

    this.apiService.deleteUsuario(usuario.id_usuario)
      .pipe(
        catchError((err: BackendMessageResponse) => {
          this.mostrarMensajeAdmin(`Error al rechazar solicitud: ${err.msg || 'Error desconocido.'}`, 'danger');
          return of(null);
        }),
        finalize(() => this.closeSidePanel())
      )
      .subscribe(() => { // Removida a verificação 'response'
        this.mostrarMensajeAdmin(`Solicitud de ${usuario.nombre} ${usuario.apellido} rechazada y eliminada.`, 'success');
        this.loadAllPendingUsers();
      });
  }

  // --- Métodos de Utilidad ---
  mostrarMensajeAdmin(mensaje: string, tipo: 'success' | 'danger' | 'warning'): void {
    this.adminEstadalMessage = mensaje;
    this.adminEstadalMessageType = tipo;
    setTimeout(() => {
      this.adminEstadalMessage = null;
      this.adminEstadalMessageType = null;
    }, 5000);
  }

  mostrarMensajeMonitoreo(mensaje: string, tipo: 'success' | 'danger' | 'warning'): void {
    this.monitoreoMessage = mensaje;
    this.monitoreoMessageType = tipo;
    setTimeout(() => {
      this.monitoreoMessage = null;
      this.monitoreoMessageType = null;
    }, 5000);
  }

  getRoleName(roleId: number): string {
    for (const [key, value] of Object.entries(ROLES)) {
      if (value === roleId) {
        return key.replace(/_/g, ' ');
      }
    }
    return 'Desconocido';
  }

  getCompleteLocation(usuario: Usuario): string {
    let location = '';
    if (usuario.nombre_estado_sugerido) location += `Estado: ${usuario.nombre_estado_sugerido}`;
    if (usuario.nombre_municipio_sugerido) location += `${location ? ' > ' : ''}Municipio: ${usuario.nombre_municipio_sugerido}`;
    if (usuario.nombre_circuito_sugerido) location += `${location ? ' > ' : ''}Circuito: ${usuario.nombre_circuito_sugerido}`;
    if (usuario.nombre_plantel_sugerido) location += `${location ? ' > ' : ''}Plantel: ${usuario.nombre_plantel_sugerido}`;
    return location || 'N/A';
  }

  getApproverRole(sugeridoRolId: number): number | null {
    switch (sugeridoRolId) {
      case ROLES.ADMIN_STATE:
        return ROLES.SUPER_ADMIN;
      case ROLES.ADMIN_MUNICIPAL:
        return ROLES.ADMIN_STATE;
      case ROLES.ADMIN_CIRCUITAL:
        return ROLES.ADMIN_MUNICIPAL;
      case ROLES.ADMIN_SQUAD:
        return ROLES.ADMIN_CIRCUITAL;
      case ROLES.STANDARD:
        return ROLES.ADMIN_SQUAD;
      default:
        return null;
    }
  }

  // MÉTODO AFECTADO: NINGUNO (Es un nuevo método de utilidad)

  /**
   * Verifica si un usuario pendiente (solicitud) está dentro del alcance geográfico
   * del usuario logueado (admin).
   * @param u El objeto Usuario pendiente.
   * @param idEstado El ID de estado asignado al usuario logueado (si aplica).
   * @param idMunicipio El ID de municipio asignado al usuario logueado (si aplica).
   * @param idCircuito El ID de circuito asignado al usuario logueado (si aplica).
   * @param codigoPlantel El código de plantel asignado al usuario logueado (si aplica).
   * @returns true si la solicitud cae dentro del alcance del administrador, false si no.
   */
  checkGeographicScope(
    u: Usuario,
    idEstado: number | null,
    idMunicipio: number | null,
    idCircuito: number | null,
    codigoPlantel: string | null
  ): boolean {

    // 1. SUPER_ADMIN (Rol 1): Siempre tiene alcance total
    if (this.currentUserRole === ROLES.SUPER_ADMIN) {
      return true;
    }

    // Si el usuario logueado no tiene un rol geográfico definido, no tiene alcance.
    if (!this.currentUserRole) {
      return false;
    }

    // 2. ADMIN_STATE (Rol 2): Filtra por Estado asignado
    if (this.currentUserRole === ROLES.ADMIN_STATE) {
      // La solicitud debe tener el mismo ID de estado que el ADMIN_STATE.
      return idEstado === u.id_estado_sugerido;
    }

    // 3. ADMIN_MUNICIPAL (Rol 3): Filtra por Municipio asignado
    if (this.currentUserRole === ROLES.ADMIN_MUNICIPAL) {
      // La solicitud debe tener el mismo ID de municipio que el ADMIN_MUNICIPAL.
      return idMunicipio === u.id_municipio_sugerido;
    }

    // 4. ADMIN_CIRCUITAL (Rol 7): Filtra por Circuito asignado
    if (this.currentUserRole === ROLES.ADMIN_CIRCUITAL) {
      // La solicitud debe tener el mismo ID de circuito que el ADMIN_CIRCUITAL.
      return idCircuito === u.id_circuito_sugerido;
    }

    // 5. ADMIN_SQUAD / STANDARD (Rol 4 y 5): Filtra por Plantel asignado
    if (this.currentUserRole === ROLES.ADMIN_SQUAD || this.currentUserRole === ROLES.STANDARD) {
      // La solicitud debe tener el mismo código de plantel que el ADMIN_SQUAD.
      return codigoPlantel === u.codigo_plantel_sugerido;
    }

    // Para cualquier otro rol (ej. PENDING), por seguridad, retorna falso.
    return false;
  }
}
