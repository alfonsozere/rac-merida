import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { filter, map } from 'rxjs/operators';
import { forkJoin, Observable, Subscription, of } from 'rxjs';

// Importar los servicios y modelos necesarios
import { Usuario } from '../../../../core/models/usuario.model';
import { ROLES, TIPO_PERSONAL } from '../../../../core/constants/constantes';
import { LookupItem, LookupService } from '../../../../core/services/lookup';
import { Plantel } from '../../../../core/models/plantel.model';
import { Estado } from '../../../../core/models/estado.model';
import { Municipio } from '../../../../core/models/municipio.model';
import { Circuito } from '../../../../core/models/circuito.model';
import { Auth } from '../../../../core/services/auth';
import { ServicioEmpleado } from '../../../../core/services/empleado';

@Component({
  selector: 'app-empleado-circuito',
  imports: [
    CommonModule,
    ReactiveFormsModule 
  ],
  templateUrl: './empleado-circuito.html',
  styleUrl: './empleado-circuito.css',
})
export class EmpleadoCircuito implements OnInit, OnDestroy {
  @Input() selectedCard: any | null = null;
  @Output() goBack = new EventEmitter<void>();

  empleados: any[] = [];
  cargando: boolean = false;
  error: string | null = null;

  formularioEmpleado!: FormGroup;
  modoEdicion: boolean = false;
  empleadoSeleccionadoId: number | null = null;

  currentUser: Usuario | null = null;
  readonly ROLES = ROLES;
  readonly TIPO_PERSONAL = TIPO_PERSONAL;

  // Colección de suscripciones para limpieza
  private subscriptions: Subscription = new Subscription();

  // Listas para los selectores de datos de catálogos (lookups)
  sexos: LookupItem[] = [];
  ubchs: LookupItem[] = [];
  comunas: LookupItem[] = [];
  consejosComunales: LookupItem[] = [];
  tiposPersonal: LookupItem[] = [];
  turnos: LookupItem[] = [];
  situacionesLaborales: LookupItem[] = [];
  planteles: Plantel[] = [];
  cargosDocentes: LookupItem[] = [];
  cargosAdministrativos: LookupItem[] = [];
  cargosObreros: LookupItem[] = [];
  gradosObreros: LookupItem[] = [];
  tiposDocenteEspecificos: LookupItem[] = [];

  // Listas para los selectores geográficos
  estados: Estado[] = [];
  municipios: Municipio[] = [];
  circuitos: Circuito[] = [];

  constructor(
    private authService: Auth,
    private servicioEmpleado: ServicioEmpleado,
    private fb: FormBuilder,
    private lookupService: LookupService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUserData();
    if (!this.currentUser) {
      this.error = 'No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.';
      this.authService.logout();
      return;
    }

    this.initForm();
    this.loadLookupData();
    this.setupConditionalFormLogic();

    if (this.selectedCard) {
      this.cargarEmpleados();
    } else {
      this.cargarEmpleados();
    }
  }

  /**
   * Limpia las suscripciones al destruir el componente.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Inicializa el formulario reactivo con sus campos. Los campos condicionales inician sin validadores.
   */
  initForm(): void {
    this.formularioEmpleado = this.fb.group({
      cedula_empleado: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      nombre_empleado: ['', Validators.required],
      apellido_empleado: ['', Validators.required],
      id_sexo: [null, Validators.required],
      fecha_nacimiento: [null, Validators.required],
      direccion: [''],
      telefono: ['', [Validators.pattern(/^\d{10,11}$/)]],
      correo: ['', [Validators.email]],
      id_ubch: [null],
      id_comuna: [null],
      id_consejo_comunal: [null],
      fecha_ingreso_laboral: [null, Validators.required],
      id_tipo_personal: [null, Validators.required],

      // Campos que dependen de Tipo de Personal (sin validadores iniciales)
      id_cargo_docente: [null],
      codigo_docente_sufijo: [''],
      id_tipo_docente_especifico: [null],
      id_cargo_administrativo: [null],
      id_cargo_obrero: [null],
      id_grado_obrero: [null],

      // Campos que dependen de Tipo Docente Específico (sin validadores iniciales)
      horas_academicas: [0],
      horas_administrativas: [0],
      id_turno: [null],
      grado_imparte: [null],
      seccion_grado: [null],
      area_imparte: [null],
      anio_imparte: [null],
      seccion_anio: [null],
      materia_especialidad: [null],
      periodo_grupo: [null],
      
      observaciones: [''],
      id_situacion_laboral: [null],
      id_plantel: [null, Validators.required],
      id_estado: [null],
      id_municipio: [null],
      id_parroquia: [null],
      id_denominacion_plantel: [null],
      id_dependencia_plantel: [null],
      id_ubicacion_plantel: [null],
      id_nivel_plantel: [null],
      id_modalidad_plantel: [null]
    });

    // Deshabilitar id_plantel según el rol
    if (this.currentUser && (this.currentUser.cod_rol === ROLES.ADMIN_SQUAD || this.currentUser.cod_rol === ROLES.STANDARD)) {
      this.formularioEmpleado.get('id_plantel')?.disable();
    }
  }

  /**
   * Configura la lógica condicional del formulario, suscrita a id_tipo_personal.
   */
  setupConditionalFormLogic(): void {
    const tipoPersonalControl = this.formularioEmpleado.get('id_tipo_personal');
    if (!tipoPersonalControl) return;

    // Suscripción al cambio de tipo de personal
    const sub = tipoPersonalControl.valueChanges.subscribe(tipoPersonalId => {
      // 1. Limpiar validadores y valores de todos los campos condicionales
      this.resetPersonalSpecificFields();

      // 2. Configurar validadores y valores para el tipo seleccionado
      this.configurePersonalSpecificFields(tipoPersonalId);

      // 3. Forzar la revalidación del formulario
      this.formularioEmpleado.updateValueAndValidity();
    });

    this.subscriptions.add(sub);
  }
  
  /**
   * Limpia el valor y elimina los validadores de todos los campos de Cargo/Docencia/Obrero.
   * Usamos { emitEvent: false } para prevenir recursión.
   * @param resetValues - Indica si se deben resetear los valores (true para cambios, false para edición).
   */
  private resetPersonalSpecificFields(resetValues: boolean = true): void {
      const controlsToReset: string[] = [
          'id_cargo_docente', 'codigo_docente_sufijo', 'id_tipo_docente_especifico',
          'id_cargo_administrativo', 'id_cargo_obrero', 'id_grado_obrero',
          'horas_academicas', 'horas_administrativas', 'id_turno', 'grado_imparte',
          'seccion_grado', 'area_imparte', 'anio_imparte', 'seccion_anio', 
          'materia_especialidad', 'periodo_grupo'
      ];

      controlsToReset.forEach(name => {
          const control = this.formularioEmpleado.get(name);
          if (control) {
              control.clearValidators();
              control.updateValueAndValidity();
              if (resetValues) {
                  // MUY IMPORTANTE: Prevenir bucle de detección de cambios: { emitEvent: false }
                  control.setValue(control.value === '' ? '' : null, { emitEvent: false }); 
              }
          }
      });
  }

  /**
   * Configura los validadores requeridos para el tipo de personal seleccionado.
   */
  private configurePersonalSpecificFields(tipoPersonalId: number): void {
      const requiredValidator = Validators.required;
      const getControl = (name: string): AbstractControl | null => this.formularioEmpleado.get(name);

      if (tipoPersonalId === TIPO_PERSONAL.DOCENTE) {
          // DOCENTE: id_cargo_docente, id_tipo_docente_especifico (requeridos)
          getControl('id_cargo_docente')?.setValidators(requiredValidator);
          getControl('id_tipo_docente_especifico')?.setValidators(requiredValidator);
          
          // Otros campos docentes
          getControl('horas_academicas')?.setValidators(Validators.min(0));
          getControl('horas_administrativas')?.setValidators(Validators.min(0));

          // Forzar revalidación de campos docentes
          getControl('id_cargo_docente')?.updateValueAndValidity();
          getControl('id_tipo_docente_especifico')?.updateValueAndValidity();
          getControl('horas_academicas')?.updateValueAndValidity();
          getControl('horas_administrativas')?.updateValueAndValidity();
          
      } else if (tipoPersonalId === TIPO_PERSONAL.ADMINISTRATIVO) {
          // ADMINISTRATIVO: id_cargo_administrativo (requerido)
          getControl('id_cargo_administrativo')?.setValidators(requiredValidator);
          getControl('id_cargo_administrativo')?.updateValueAndValidity();
          
      } else if (tipoPersonalId === TIPO_PERSONAL.OBRERO) {
          // OBRERO: id_cargo_obrero, id_grado_obrero (requeridos)
          getControl('id_cargo_obrero')?.setValidators(requiredValidator);
          getControl('id_grado_obrero')?.setValidators(requiredValidator);

          getControl('id_cargo_obrero')?.updateValueAndValidity();
          getControl('id_grado_obrero')?.updateValueAndValidity();
      }
  }

  /**
   * Determina si el usuario actual está autorizado para realizar operaciones CRUD.
   */
  private isAuthorized(): boolean {
    if (!this.currentUser) return false;
    const allowedRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_STATE,
      ROLES.ADMIN_MUNICIPAL,
      ROLES.ADMIN_CIRCUITAL,
      ROLES.ADMIN_SQUAD,
      ROLES.STANDARD
    ];
    return allowedRoles.includes(this.currentUser.cod_rol);
  }

  /**
   * Determina si el usuario actual está autorizado solo para eliminar.
   */
  private isDeleteAuthorized(): boolean {
    if (!this.currentUser) return false;
    const allowedRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_STATE,
      ROLES.ADMIN_MUNICIPAL,
      ROLES.ADMIN_CIRCUITAL,
      ROLES.ADMIN_SQUAD,
    ];
    return allowedRoles.includes(this.currentUser.cod_rol);
  }
  
  /**
   * Carga los datos de los catálogos (lookups) y datos geográficos, aplicando el filtrado por rol.
   * CORRECCIÓN: Se utiliza las funciones específicas del LookupService para filtrar y 'map' para transformar.
   */
  loadLookupData(): void {
    this.cargando = true;
    this.error = null;

    if (!this.currentUser) {
      this.cargando = false;
      return;
    }

    const commonLookups$ = forkJoin([
      this.lookupService.getSexos(),
      this.lookupService.getUbchs(),
      this.lookupService.getComunas(),
      this.lookupService.getConsejosComunales(),
      this.lookupService.getTiposPersonal(),
      this.lookupService.getTurnos(),
      this.lookupService.getSituacionesLaborales(),
      this.lookupService.getCargosDocentes(),
      this.lookupService.getCargosAdministrativos(),
      this.lookupService.getCargosObreros(),
      this.lookupService.getGradosObreros(),
      this.lookupService.getTiposDocenteEspecificos()
    ]);

    let estados$: Observable<Estado[]>;
    let municipios$: Observable<Municipio[]>;
    let circuitos$: Observable<Circuito[]>;
    let planteles$: Observable<Plantel[]>;

    const idEstado = this.currentUser.id_estado_asignado;
    const idMunicipio = this.currentUser.id_municipio_asignado;
    const idCircuito = this.currentUser.id_circuito_asignado;
    const codPlantel = this.currentUser.codigo_plantel_asignado;

    // 1. Determinar el Observable de Estados (siempre filtrado por el rol asignado si existe)
    estados$ = this.lookupService.getEstados().pipe(
      map(estados => (idEstado) ? estados.filter(e => e.id === idEstado) : estados)
    );

    // 2. Determinar los Observables de Municipios, Circuitos y Planteles
    switch (this.currentUser.cod_rol) {
      case ROLES.SUPER_ADMIN:
      case ROLES.ADMIN_STATE:
        // Carga completa (usan las funciones sin argumentos)
        municipios$ = this.lookupService.getMunicipios();
        circuitos$ = this.lookupService.getCircuitos();
        planteles$ = this.lookupService.getPlanteles();
        break;

      case ROLES.ADMIN_MUNICIPAL:
        // Filtra por Estado y Municipio asignados
        municipios$ = (idEstado !== null && idEstado !== undefined) ? this.lookupService.getMunicipiosByEstado(idEstado) : of([]);
        circuitos$ = (idMunicipio !== null && idMunicipio !== undefined) ? this.lookupService.getCircuitosByMunicipio(idMunicipio) : of([]);
        planteles$ = (idMunicipio !== null && idMunicipio !== undefined) ? this.lookupService.getPlantelesByMunicipio(idMunicipio) : of([]);
        break;

      case ROLES.ADMIN_CIRCUITAL:
        // Filtra por Municipio y Circuito asignados
        municipios$ = (idEstado !== null && idEstado !== undefined) ? this.lookupService.getMunicipiosByEstado(idEstado) : of([]);
        circuitos$ = (idMunicipio !== null && idMunicipio !== undefined) ? this.lookupService.getCircuitosByMunicipio(idMunicipio) : of([]);
        
        // Carga planteles por circuito o municipio
        if (idCircuito !== null && idCircuito !== undefined) {
          planteles$ = this.lookupService.getPlantelesByCircuito(idCircuito);
        } else if (idMunicipio !== null && idMunicipio !== undefined) {
          planteles$ = this.lookupService.getPlantelesByMunicipio(idMunicipio);
        } else {
          planteles$ = of([]);
        }
        break;

      case ROLES.ADMIN_SQUAD:
      case ROLES.STANDARD:
        // Filtra geográficamente por lo que está disponible y el plantel por código
        municipios$ = (idEstado !== null && idEstado !== undefined) ? this.lookupService.getMunicipiosByEstado(idEstado) : of([]);
        circuitos$ = (idMunicipio !== null && idMunicipio !== undefined) ? this.lookupService.getCircuitosByMunicipio(idMunicipio) : of([]);
        
        // Carga solo el plantel asignado (usa getPlanteles() y luego filtra, para manejar la interfaz Plantel[])
        planteles$ = this.lookupService.getPlanteles().pipe(
          map(planteles => (codPlantel) ? planteles.filter(p => p.codigo_plantel === codPlantel) : [])
        );
        break;

      default:
        // Roles PENDING o sin ámbito definido: Carga vacío si no hay asignación
        municipios$ = of([]);
        circuitos$ = of([]);
        planteles$ = of([]);
        break;
    }

    // 3. Combinar y Suscribirse
    const geoLookups$ = forkJoin([estados$, municipios$, circuitos$, planteles$]);
    
    forkJoin([commonLookups$, geoLookups$]).subscribe({
      next: ([commonData, geoData]) => {
        [this.sexos, this.ubchs, this.comunas, this.consejosComunales, this.tiposPersonal, this.turnos, this.situacionesLaborales, this.cargosDocentes, this.cargosAdministrativos, this.cargosObreros, this.gradosObreros, this.tiposDocenteEspecificos] = commonData;
        [this.estados, this.municipios, this.circuitos, this.planteles] = geoData;

        // Establecer el valor del plantel para ADMIN_SQUAD y STANDARD
        if (this.currentUser && (this.currentUser.cod_rol === ROLES.ADMIN_SQUAD || this.currentUser.cod_rol === ROLES.STANDARD) && this.planteles.length === 1) {
          this.formularioEmpleado.get('id_plantel')?.setValue(this.planteles[0].id_plantel, { emitEvent: false });
        }
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.error = 'Error al cargar datos de catálogos o geográficos. Es posible que no tenga permisos para ver algunos datos.';
        console.error('Error al cargar datos de catálogos y geográficos:', err);
      }
    });
  }

  /**
   * Obtiene el nombre legible de un rol.
   */
  getRoleNameById(roleId: number): string {
    switch (roleId) {
      case ROLES.SUPER_ADMIN: return 'Super Administrador';
      case ROLES.ADMIN_STATE: return 'Administrador de Estado';
      case ROLES.ADMIN_MUNICIPAL: return 'Administrador Municipal';
      case ROLES.ADMIN_CIRCUITAL: return 'Administrador Circuital';
      case ROLES.ADMIN_SQUAD: return 'Administrador de Plantel';
      case ROLES.STANDARD: return 'Estándar';
      case ROLES.PENDING: return 'Pendiente de Aprobación';
      default: return 'Desconocido';
    }
  }

  /**
   * Limpia el formulario de empleado.
   */
  limpiarFormulario(): void {
    this.formularioEmpleado.reset();
    this.modoEdicion = false;
    this.empleadoSeleccionadoId = null;

    // Limpia validadores y valores de los campos condicionales
    this.resetPersonalSpecificFields(true); 

    // Restaurar el valor de id_plantel para ADMIN_SQUAD/STANDARD si aplica
    if (this.currentUser && (this.currentUser.cod_rol === ROLES.ADMIN_SQUAD || this.currentUser.cod_rol === ROLES.STANDARD) && this.planteles.length === 1) {
      this.formularioEmpleado.get('id_plantel')?.setValue(this.planteles[0].id_plantel, { emitEvent: false });
      this.formularioEmpleado.get('id_plantel')?.disable();
    } else {
      this.formularioEmpleado.get('id_plantel')?.enable();
      this.formularioEmpleado.get('id_plantel')?.setValue(null);
    }

    this.formularioEmpleado.markAsUntouched();
    this.formularioEmpleado.markAsPristine();
    this.formularioEmpleado.updateValueAndValidity();
  }

  /**
   * Guarda (crea o actualiza) un registro de empleado.
   */
  guardarEmpleado(): void {
    if (!this.isAuthorized()) {
      this.error = 'Acceso denegado. No tienes permisos para crear o editar empleados.';
      return;
    }

    // Usamos getRawValue() para obtener valores de controles deshabilitados (como id_plantel)
    const dataToSend = { ...this.formularioEmpleado.getRawValue() };

    if (this.formularioEmpleado.invalid) {
      this.error = 'Por favor, complete todos los campos requeridos y corrija los errores del formulario.';
      this.markAllAsTouched(this.formularioEmpleado);
      return;
    }
    
    // Sobrescribe id_plantel con el valor asignado por el rol si está deshabilitado
    if (this.formularioEmpleado.get('id_plantel')?.disabled && this.currentUser?.codigo_plantel_asignado) {
      dataToSend.id_plantel = this.currentUser.codigo_plantel_asignado;
    }

    this.cargando = true;
    this.error = null;

    if (this.modoEdicion && this.empleadoSeleccionadoId !== null) {
      this.servicioEmpleado.actualizarEmpleado(this.empleadoSeleccionadoId, dataToSend)
        .subscribe({
          next: (res: any) => {
            this.cargando = false;
            this.limpiarFormulario();
            this.cargarEmpleados();
            this.error = 'Empleado actualizado exitosamente.';
            setTimeout(() => this.error = null, 3000);
          },
          error: (err: HttpErrorResponse) => {
            this.cargando = false;
            this.error = `Error al actualizar empleado: ${err.error?.msg || err.message || 'Error de servidor desconocido'}.`;
          }
        });
    } else {
      this.servicioEmpleado.crearEmpleado(dataToSend)
        .subscribe({
          next: (res: any) => {
            this.cargando = false;
            this.limpiarFormulario();
            this.cargarEmpleados();
            this.error = 'Empleado creado exitosamente.';
            setTimeout(() => this.error = null, 3000);
          },
          error: (err: HttpErrorResponse) => {
            this.cargando = false;
            this.error = `Error al crear empleado: ${err.error?.msg || err.message || 'Error de servidor desconocido'}.`;
          }
        });
    }
  }

  /**
   * Prepara el formulario para la edición de un empleado existente.
   */
  editarEmpleado(empleado: any): void {
    if (!this.isAuthorized()) {
      this.error = 'Acceso denegado. No tienes permisos para editar este empleado.';
      return;
    }
    
    this.modoEdicion = true;
    this.empleadoSeleccionadoId = empleado.id_empleado;

    this.patchFormValues(empleado);

    this.formularioEmpleado.get('id_tipo_personal')?.updateValueAndValidity();
  }

  /**
   * Rellena el formulario con los valores de un empleado.
   */
  private patchFormValues(empleado: any): void {
    // 1. Limpia los validadores y valores (sin resetear los valores, solo para limpiar validadores antiguos)
    this.resetPersonalSpecificFields(false); 

    this.formularioEmpleado.patchValue({
      // Campos comunes
      cedula_empleado: empleado.cedula,
      nombre_empleado: empleado.nombre,
      apellido_empleado: empleado.apellido,
      id_sexo: empleado.id_sexo,
      fecha_nacimiento: empleado.fecha_nacimiento ? empleado.fecha_nacimiento.substring(0, 10) : null,
      direccion: empleado.direccion,
      telefono: empleado.telefono,
      correo: empleado.correo,
      id_ubch: empleado.id_ubch,
      id_comuna: empleado.id_comuna,
      id_consejo_comunal: empleado.id_consejo_comunal,
      fecha_ingreso_laboral: empleado.fecha_ingreso_laboral ? empleado.fecha_ingreso_laboral.substring(0, 10) : null,
      id_tipo_personal: empleado.id_tipo_personal,
      observaciones: empleado.observaciones,
      id_situacion_laboral: empleado.id_situacion_laboral,
      id_plantel: empleado.id_plantel,
      id_estado: empleado.plantel_estado_id || null,
      id_municipio: empleado.plantel_municipio_id || null,
      id_parroquia: empleado.id_parroquia || null,

      // Campos específicos
      horas_academicas: empleado.horas_academicas,
      horas_administrativas: empleado.horas_administrativas,
      id_turno: empleado.id_turno,
      grado_imparte: empleado.grado_imparte,
      seccion_grado: empleado.seccion_grado,
      area_imparte: empleado.area_imparte,
      anio_imparte: empleado.anio_imparte,
      seccion_anio: empleado.seccion_anio,
      materia_especialidad: empleado.materia_especialidad,
      periodo_grupo: empleado.periodo_grupo,
      id_cargo_docente: empleado.id_cargo_docente,
      codigo_docente_sufijo: empleado.codigo_docente_sufijo || '',
      id_cargo_administrativo: empleado.id_cargo_administrativo,
      id_cargo_obrero: empleado.id_cargo_obrero,
      id_grado_obrero: empleado.id_grado_obrero,
      id_tipo_docente_especifico: empleado.id_tipo_docente_especifico || null,
    }, { emitEvent: false }); // Desactivar la emisión de eventos durante el patch

    // 2. APLICAR LÓGICA CONDICIONAL: Forzar la configuración de validadores con el valor cargado
    const tipoPersonalId = this.formularioEmpleado.get('id_tipo_personal')?.value;
    if (tipoPersonalId !== null) {
        this.configurePersonalSpecificFields(tipoPersonalId);
    }
    
    this.formularioEmpleado.updateValueAndValidity();
  }

  /**
   * Elimina un empleado del sistema.
   */
  eliminarEmpleado(id: number, nombreEmpleado: string): void {
    if (!this.isDeleteAuthorized()) {
      this.error = 'Acceso denegado. No tienes permisos para eliminar empleados.';
      return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar al empleado ${nombreEmpleado}? Esta acción es irreversible.`)) {
      this.cargando = true;
      this.error = null;
      this.servicioEmpleado.eliminarEmpleado(id)
        .subscribe({
          next: (res: any) => {
            this.cargando = false;
            this.cargarEmpleados();
            this.limpiarFormulario();
            this.error = 'Empleado eliminado exitosamente.';
            setTimeout(() => this.error = null, 3000);
          },
          error: (err: HttpErrorResponse) => {
            this.cargando = false;
            this.error = `Error al eliminar empleado: ${err.error?.msg || err.message || 'Error de servidor desconocido'}.`;
          }
        });
    }
  }

  /**
   * Carga la lista de empleados.
   */
  cargarEmpleados(): void {
    this.cargando = true;
    this.error = null;

    this.servicioEmpleado.obtenerEmpleados()
      .subscribe({
        next: (data: any[]) => {
          this.empleados = data;
          this.cargando = false;
        },
        error: (err: HttpErrorResponse) => {
          this.cargando = false;
          if (err.error && err.error.msg) {
            this.error = `Error al cargar empleados: ${err.error.msg}`;
          } else if (err.status === 403) {
            this.error = 'Acceso denegado. No tienes permisos para ver esta información.';
          } else if (err.status === 401) {
            this.error = 'Sesión expirada o no autorizada. Por favor, inicia sesión.';
          } else {
            this.error = 'Ocurrió un error inesperado al cargar los empleados. Por favor, inténtalo de nuevo más tarde.';
          }
        }
      });
  }

  /**
   * Emite el evento para regresar a la vista anterior.
   */
  emitGoBack(): void {
    this.goBack.emit();
  }

  /**
   * Marca todos los controles de un FormGroup como "touched".
   */
  markAllAsTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markAllAsTouched(control);
      }
    });
  }
}
