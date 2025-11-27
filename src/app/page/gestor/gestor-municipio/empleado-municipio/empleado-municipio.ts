import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { forkJoin, Observable, Subscription, of } from 'rxjs'; // Se añade 'of' para Observables vacíos o predeterminados
import { filter, map, catchError } from 'rxjs/operators';


import { Usuario } from '../../../../core/models/usuario.model';
import { ROLES, TIPO_PERSONAL } from '../../../../core/constants/constantes';
import { LookupItem, LookupService } from '../../../../core/services/lookup';
import { Plantel } from '../../../../core/models/plantel.model';
import { CargosObreros } from '../../../../core/models/cargos-obreros.model';
import { Estado } from '../../../../core/models/estado.model';
import { Municipio } from '../../../../core/models/municipio.model';
import { Circuito } from '../../../../core/models/circuito.model';
import { Auth } from '../../../../core/services/auth';
import { ServicioEmpleado } from '../../../../core/services/empleado';

@Component({
  selector: 'app-empleado-municipio',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './empleado-municipio.html',
  styleUrl: './empleado-municipio.css',
})
export class EmpleadoMunicipio implements OnInit, OnDestroy {
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
  tiposDocenteEspecificos: LookupItem[] = [];
  cargosAdministrativos: LookupItem[] = [];
  cargosObreros: CargosObreros[] = [];
  gradosObreros: LookupItem[] = [];
  cargosObrerosFiltrados: CargosObreros[] = [];

  // Listas para los selectores geográficos
  estados: Estado[] = [];
  municipios: Municipio[] = [];
  circuitos: Circuito[] = [];

  /**
 * Convierte valores falsy (cadenas vacías y arrays vacíos) a NULL.
 * Esto es esencial para que el backend (Node.js/PostgreSQL) pueda:
 * 1. Evitar errores de tipo al intentar insertar '' en columnas INTEGER (claves foráneas).
 * 2. Manejar correctamente los campos opcionales (NULLable) de la base de datos.
 */
  private sanitizeData(data: any): any {
    // Trabaja con una copia de los datos
    const sanitized = { ...data };

    for (const key in sanitized) {
      if (sanitized.hasOwnProperty(key)) {
        const value = sanitized[key];

        // Si el valor es una cadena vacía ('') o un array vacío (si aplica), se convierte a null.
        if (value === '' || (Array.isArray(value) && value.length === 0)) {
          sanitized[key] = null;
        }

        // NOTA: Si un campo numérico opcional se deja vacío en el formulario, 
        // suele enviarse como '' (cadena vacía), por lo que la primera condición es suficiente.
      }
    }
    return sanitized;
  }

  constructor(
    private authService: Auth,
    private servicioEmpleado: ServicioEmpleado,
    private fb: FormBuilder,
    private lookupService: LookupService
  ) { }

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

    const subGrado = this.formularioEmpleado.get('id_grado_obrero')?.valueChanges.subscribe(gradoId => {
      this.filtrarCargosObrero(gradoId);
    });

    if (subGrado) {
      this.subscriptions.add(subGrado);
    }

    const tipoPersonalInicial = this.formularioEmpleado.get('id_tipo_personal')?.value;
    if (tipoPersonalInicial === this.TIPO_PERSONAL.OBRERO) {
      const gradoInicial = this.formularioEmpleado.get('id_grado_obrero')?.value;
      this.filtrarCargosObrero(gradoInicial);
    }

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
  // En EmpleadosUsuarioComponent
  // ...

  private configurePersonalSpecificFields(tipoPersonalId: number): void {
    const requiredValidator = Validators.required;
    const getControl = (name: string): AbstractControl | null => this.formularioEmpleado.get(name);

    // --- 1. Definición de Controles por Categoría ---
    const docenteControls = ['id_cargo_docente', 'id_tipo_docente_especifico', 'horas_academicas', 'horas_administrativas'];
    const administrativoControls = ['id_cargo_administrativo'];
    const obreroControls = ['id_cargo_obrero', 'id_grado_obrero'];

    // Lista completa de todos los campos específicos de personal
    const allSpecificControls = [
      ...docenteControls,
      ...administrativoControls,
      ...obreroControls,
      'grado_imparte', 'seccion_grado', 'area_imparte', 'anio_imparte', 'seccion_anio', 'materia_especialidad', 'periodo_grupo', 'id_turno'
    ];

    // --- 2. Fase de Limpieza (CRUCIAL): Remover Validadores y Limpiar Valores No Usados ---
    allSpecificControls.forEach(name => {
      const control = getControl(name);

      // Remover cualquier validador que exista de ediciones anteriores
      control?.clearValidators();

      // Limpiar el valor solo si no se va a usar en esta iteración. 
      // En modo edición, es mejor no limpiar el valor (siempre y cuando el patchValue se ejecute primero)
      // Por ahora, solo nos enfocaremos en la limpieza de validadores.

      // Marcar todos como válidos temporalmente para evitar que el formulario se bloquee
      control?.updateValueAndValidity();
    });


    // --- 3. Aplicación de Validadores Específicos y Revalidación ---

    if (tipoPersonalId === TIPO_PERSONAL.DOCENTE) {
      // Campos de DOCENTE (Aplica Validators.required)
      getControl('id_cargo_docente')?.setValidators(requiredValidator);
      getControl('id_tipo_docente_especifico')?.setValidators(requiredValidator);

      // Otros validadores
      getControl('horas_academicas')?.setValidators(Validators.min(0));
      getControl('horas_administrativas')?.setValidators(Validators.min(0));

      // Forzar la revalidación de los campos modificados
      docenteControls.forEach(name => getControl(name)?.updateValueAndValidity());

    } else if (tipoPersonalId === TIPO_PERSONAL.ADMINISTRATIVO) {
      // Campos de ADMINISTRATIVO (Aplica Validators.required)
      getControl('id_cargo_administrativo')?.setValidators(requiredValidator);

      // Forzar la revalidación
      administrativoControls.forEach(name => getControl(name)?.updateValueAndValidity());

    } else if (tipoPersonalId === TIPO_PERSONAL.OBRERO) {
      // Campos de OBRERO (Aplica Validators.required)
      getControl('id_cargo_obrero')?.setValidators(requiredValidator);
      getControl('id_grado_obrero')?.setValidators(requiredValidator);

      // Forzar la revalidación
      obreroControls.forEach(name => getControl(name)?.updateValueAndValidity());
    }

    // Nota Importante: La función updateValueAndValidity() debe llamarse en los controles
    // después de setValidators() y, finalmente, en el formulario completo
    // al final de patchFormValues.

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
      ROLES.STANDARD,
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
    let municipios$: Observable<Municipio[]> = of([]);
    let circuitos$: Observable<Circuito[]> = of([]);
    let planteles$: Observable<Plantel[]> = of([]);

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

        // Carga solo el plantel asignado (hace la comparación insensible a mayúsculas/minúsculas y espacios)
        planteles$ = this.lookupService.getPlanteles().pipe(
          // ✨ AÑADIDO: Si la llamada HTTP falla (ej. 403), lo capturamos y devolvemos []
          catchError((err: HttpErrorResponse) => {
            console.error('ERROR EN API PLANTEL (Posible 403): Falló la carga inicial de planteles.', err.status, err.message);
            this.error = 'Error de permisos al cargar planteles asignados. Contacte a soporte.';
            return of([]); // Devuelve un array vacío para que forkJoin continúe
          }),
          map(planteles => {

            if (!codPlantel) return [];

            // Sanitiza el código del usuario para una comparación segura
            const safeCodPlantel = codPlantel.trim().toLowerCase();

            // Filtra asegurando que el código del plantel también se sanee
            const plantelesFiltrados = planteles.filter(p =>
              p.codigo_plantel && p.codigo_plantel.trim().toLowerCase() === safeCodPlantel
            );

            return plantelesFiltrados;
          })
        );
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

          const plantelId = this.planteles[0].id_plantel;

          // ✅ CORRECCIÓN APLICADA: Se usa 'id_plantel' para el control del formulario.
          this.formularioEmpleado.get('id_plantel')?.setValue(plantelId, { emitEvent: false });

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
      case ROLES.ADMIN_SQUAD: return 'Director de Plantel';
      case ROLES.STANDARD: return 'Secretario del plantel';
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

    if (this.formularioEmpleado.invalid) {
      this.error = 'Por favor, complete todos los campos requeridos y corrija los errores del formulario.';
      this.markAllAsTouched(this.formularioEmpleado);
      return;
    }

    // 1. Obtener valores brutos (incluyendo deshabilitados)
    // getRawValue() incluye todos los campos, habilitados y deshabilitados.
    let dataToSend = { ...this.formularioEmpleado.getRawValue() };

    // 2. CRUCIAL: Saneamiento de datos. Convierte cadenas vacías ('') a null.
    dataToSend = this.sanitizeData(dataToSend);

    // 3. ✨ CORRECCIÓN DE PLANTEL ASIGNADO PARA ROLES RESTRINGIDOS (ADMIN_SQUAD/STANDARD) ✨
    // La lógica anterior fallaba porque dependía de que 'this.planteles' tuviera length=1 al guardar.
    // Ahora, solo verificamos si el control está deshabilitado y si tiene el valor (que debió cargarse en ngOnInit).
    const plantelControl = this.formularioEmpleado.get('id_plantel');

    if (plantelControl?.disabled) {
      // Reinsertamos el valor del control deshabilitado, ya que getRawValue() a veces lo omite o lo devuelve incorrecto.
      // Si el valor es NULL, es porque la carga en loadLookupData falló.
      if (plantelControl.value === null || plantelControl.value === undefined) {
        this.error = 'Error de configuración: ID de plantel asignado no disponible.';
        return;
      }
      // Si el control deshabilitado TIENE un valor (el ID NUMÉRICO), lo forzamos en dataToSend.
      dataToSend.id_plantel = plantelControl.value;
    }
    // Si el campo NO está deshabilitado (roles superiores), dataToSend ya tiene el valor seleccionado por el usuario.

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
            this.error = `Error al crear empleado: ${err.error?.msg || err.error?.details || err.message || 'Error de servidor desconocido'}.`;
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

    // 💡 CORRECCIÓN CLAVE:
    // Revalidar el formulario completo después de parchar valores
    // y aplicar validadores condicionales.
    this.formularioEmpleado.updateValueAndValidity();

    // Esta línea ahora es redundante, ya que la anterior revalida todo:
    // this.formularioEmpleado.get('id_tipo_personal')?.updateValueAndValidity();
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

    // La librería confirm() será reemplazada por un modal, pero por ahora se mantiene
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

            // ⭐ LOG DE AUDITORÍA EN FRONTEND SOBRE FALLO ⭐
            console.error('[FRONTEND] Fallo en la eliminación:', err.status, err.error);

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

  /**
 * Filtra los cargos de Obrero basándose en el Grado de Obrero seleccionado.
 * También limpia el campo de cargo si no hay grado o si el cargo actual no es válido.
 */
  filtrarCargosObrero(gradoId: number | null): void {
    this.formularioEmpleado.get('id_cargo_obrero')?.setValue(null, { emitEvent: false });

    if (!gradoId) {
      this.cargosObrerosFiltrados = [];
      return;
    }

    this.cargosObrerosFiltrados = this.cargosObreros.filter(cargo =>
      cargo.id_grado_obrero === gradoId
    );
  }
}
