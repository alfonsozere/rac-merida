import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { forkJoin, Observable, Subscription, of } from 'rxjs';
import { filter, map, catchError } from 'rxjs/operators';
import { ROLES, TIPO_PERSONAL } from '../../../../core/constants/constantes';
import { LookupItem, LookupService } from '../../../../core/services/lookup';
import { Empleado } from '../../../../core/models/empleado.model';
import { Usuario } from '../../../../core/models/usuario.model';
import { Plantel } from '../../../../core/models/plantel.model';
import { CargosObreros } from '../../../../core/models/cargos-obreros.model';
import { Estado } from '../../../../core/models/estado.model';
import { Municipio } from '../../../../core/models/municipio.model';
import { Circuito } from '../../../../core/models/circuito.model';
import { Auth } from '../../../../core/services/auth';
import { ServicioEmpleado } from '../../../../core/services/empleado';
import { CargoAdministrativos } from '../../../../core/models/cargo-administrativos.model';
import { Sexo } from '../../../../core/models/sexo.model';
import { Ubch } from '../../../../core/models/ubch.model';
import { Comunas } from '../../../../core/models/comunas.model';
import { ConsejoComunales } from '../../../../core/models/consejo-comunales.model';
import { TiposPersonal } from '../../../../core/models/tipos-personal.model';
import { Turnos } from '../../../../core/models/turnos.model';
import { SituacionLaboral } from '../../../../core/models/situacion-laboral.model';
import { CargoDocentes } from '../../../../core/models/cargo-docentes.model';
import { DocentesEspecificos } from '../../../../core/models/docentes-especificos.model';
import { GradosObreros } from '../../../../core/models/grados-obreros.model';
import { CodigoSufijoDocente } from '../../../../core/models/codigo-sufijo-docente.model';


@Component({
  selector: 'app-empleado-director',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './empleado-director.html',
  styleUrl: './empleado-director.css',
})
export class EmpleadoDirector implements OnInit, OnDestroy {
  @Input() selectedCard: any | null = null;
  @Output() goBack = new EventEmitter<void>();

  empleados: Empleado[] = [];
  cargando: boolean = false;
  error: string | null = null;

  formularioEmpleado!: FormGroup;
  modoEdicion: boolean = false;
  empleadoSeleccionadoId: number | null = null;

  currentUser: Usuario | null = null;
  readonly ROLES = ROLES;
  readonly TIPO_PERSONAL = TIPO_PERSONAL;
  private subscriptions: Subscription = new Subscription();

  sexos: Sexo[] = [];
  ubchs: Ubch[] = [];
  comunas: Comunas[] = [];
  consejosComunales: ConsejoComunales[] = [];
  tiposPersonal: TiposPersonal[] = [];
  turnos: Turnos[] = [];
  situacionesLaborales: SituacionLaboral[] = [];
  planteles: Plantel[] = [];
  cargosDocentes: CargoDocentes[] = [];
  codigoSufijoDocente: CodigoSufijoDocente[] = [];
  tiposDocenteEspecificos: DocentesEspecificos[] = [];
  cargosAdministrativos: CargoAdministrativos[] = [];
  cargosObreros: CargosObreros[] = [];
  gradosObreros: GradosObreros[] = [];
  cargosObrerosFiltrados: CargosObreros[] = [];
  estados: Estado[] = [];
  municipios: Municipio[] = [];
  circuitos: Circuito[] = [];

  private sanitizeData(data: any): any {
    const sanitized = { ...data };
    for (const key in sanitized) {
      if (sanitized.hasOwnProperty(key)) {
        const value = sanitized[key];
        if (value === '' || (Array.isArray(value) && value.length === 0)) {
          sanitized[key] = null;
        }
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
    const tipoPersonalControl = this.formularioEmpleado.get('id_tipo_personal');
    const cargoAdminControl = this.formularioEmpleado.get('id_cargo_administrativo');
    const codigoAdminControl = this.formularioEmpleado.get('codigo_administrativo');

    // 1. Deshabilitar código administrativo si el tipo de personal es ADMINISTRATIVO
    if (tipoPersonalControl && codigoAdminControl) {
      const subTipoPersonal = tipoPersonalControl.valueChanges.subscribe(value => {
        if (value === this.TIPO_PERSONAL.ADMINISTRATIVO) {
          codigoAdminControl.disable({ emitEvent: false });
        } else {
          codigoAdminControl.enable({ emitEvent: false });
          codigoAdminControl.setValue(null, { emitEvent: false });
        }
      });
      this.subscriptions.add(subTipoPersonal);
    }

    // 2. Rellenar código administrativo según el cargo seleccionado
    if (cargoAdminControl && codigoAdminControl) {
      const subCargoAdmin = cargoAdminControl.valueChanges.subscribe(value => {
        if (value) {
          const cargoSeleccionado = this.cargosAdministrativos.find(c => c.id === value);
          if (cargoSeleccionado) {
            codigoAdminControl.setValue(cargoSeleccionado.codigo_cargo, { emitEvent: false });
            codigoAdminControl.disable({ emitEvent: false });
          }
        } else {
          codigoAdminControl.setValue(null, { emitEvent: false });
          codigoAdminControl.enable({ emitEvent: false });
        }
      });
      this.subscriptions.add(subCargoAdmin);
    }

    const subCargoDocente = this.formularioEmpleado.get('id_cargo_docente')?.valueChanges.subscribe(idCargo => {
      if (idCargo) {
        this.lookupService.getCodigosByCargoDocente(idCargo).subscribe(codigos => {
          this.codigoSufijoDocente = codigos;
          this.formularioEmpleado.get('codigo_docente_sufijo')?.setValue(null);
          this.formularioEmpleado.get('codigo_docente_sufijo')?.enable();
        });
      } else {
        this.codigoSufijoDocente = [];
        this.formularioEmpleado.get('codigo_docente_sufijo')?.disable();
      }
    });
    this.subscriptions.add(subCargoDocente);

      const tipoDocenteControl = this.formularioEmpleado.get('id_tipo_docente_especifico');
  if (tipoDocenteControl) {
    const subTipoDocente = tipoDocenteControl.valueChanges.subscribe(tipo => {
      // Primero deshabilitamos todos los campos de detalle
      ['grado_imparte','seccion_grado','area_imparte','anio_imparte','seccion_anio','materia_especialidad','periodo_grupo']
        .forEach(name => this.formularioEmpleado.get(name)?.disable({ emitEvent: false }));

      // Luego habilitamos según el tipo seleccionado
      if (tipo === 1) {
        this.formularioEmpleado.get('grado_imparte')?.enable({ emitEvent: false });
        this.formularioEmpleado.get('seccion_grado')?.enable({ emitEvent: false });
      } else if (tipo === 2) {
        this.formularioEmpleado.get('area_imparte')?.enable({ emitEvent: false });
        this.formularioEmpleado.get('anio_imparte')?.enable({ emitEvent: false });
        this.formularioEmpleado.get('seccion_anio')?.enable({ emitEvent: false });
      } else if (tipo === 3) {
        this.formularioEmpleado.get('materia_especialidad')?.enable({ emitEvent: false });
        this.formularioEmpleado.get('periodo_grupo')?.enable({ emitEvent: false });
      }
    });
    this.subscriptions.add(subTipoDocente);
  }
  const subSituacion = this.formularioEmpleado.get('id_situacion_laboral')?.valueChanges.subscribe(idSit => {
  const situacion = this.situacionesLaborales.find(s => s.id === idSit);
  this.formularioEmpleado.get('descripcion_situacion_laboral')?.setValue(situacion?.descripcion || '');
});
this.subscriptions.add(subSituacion);

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

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
      codigo_administrativo: [{ value: null, disabled: true }],
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
      descripcion_situacion_laboral: [{ value: '', disabled: true }],
      id_plantel: [null, Validators.required],
      /* id_estado: [null],
       id_municipio: [null],
       id_parroquia: [null],
       id_denominacion_plantel: [null],
       id_dependencia_plantel: [null],
       id_ubicacion_plantel: [null],
       id_nivel_plantel: [null],
       id_modalidad_plantel: [null] */
    });

    // Deshabilitar id_plantel según el rol
    if (this.currentUser && (this.currentUser.cod_rol === ROLES.ADMIN_SQUAD || this.currentUser.cod_rol === ROLES.STANDARD)) {
      this.formularioEmpleado.get('id_plantel')?.disable();
    }
  }

  setupConditionalFormLogic(): void {
    const tipoPersonalControl = this.formularioEmpleado.get('id_tipo_personal');
    if (!tipoPersonalControl) return;
    const sub = tipoPersonalControl.valueChanges.subscribe(tipoPersonalId => {
      this.resetPersonalSpecificFields();
      this.configurePersonalSpecificFields(tipoPersonalId);
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
          // Importante: Deshabilitar temporalmente los campos que no se usen.
          // Revertimos la habilitación/deshabilitación a como estaba antes de que el usuario lo revirtiera.
          // Si un control no tiene valor, es más seguro deshabilitarlo y habilitarlo solo si aplica.
          control.disable({ emitEvent: false }); // Deshabilitamos todo lo específico por defecto
          control.setValue(control.value === '' ? '' : null, { emitEvent: false });
        } else {
          // Durante el patch (resetValues = false), nos aseguramos de que todos los controles puedan recibir el valor
          control.enable({ emitEvent: false });
        }
      }
    });
  }


  private configurePersonalSpecificFields(tipoPersonalId: number): void {
    const requiredValidator = Validators.required;
    // Helper para acceder a los controles
    const getControl = (name: string): AbstractControl | null => this.formularioEmpleado.get(name);

    // Definición de controles específicos por tipo
    const docenteControls = ['id_cargo_docente', 'id_tipo_docente_especifico', 'horas_academicas', 'horas_administrativas', 'id_turno'];
    const administrativoControls = ['id_cargo_administrativo', 'horas_administrativas', 'id_turno'];
    const obreroControls = ['id_cargo_obrero', 'id_grado_obrero', 'horas_administrativas', 'id_turno'];

    // Lista de todos los controles específicos que deben ser manipulados (limpiados o validados)
    const allSpecificControls = [
      ...docenteControls,
      ...administrativoControls,
      'grado_imparte', 'seccion_grado', 'area_imparte', 'anio_imparte', 'seccion_anio', 'materia_especialidad', 'periodo_grupo'
    ];

    // 1. Limpiar validadores en todos los campos para empezar de cero y deshabilitar
    allSpecificControls.forEach(name => {
      const control = getControl(name);
      control?.clearValidators();
      // Mantenemos la habilitación/deshabilitación en resetPersonalSpecificFields para controlar el 'patch' correctamente.
      control?.updateValueAndValidity();
    });

    // 2. Aplicar validadores específicos y habilitar según el tipo de personal
    if (tipoPersonalId === TIPO_PERSONAL.DOCENTE) {

      getControl('id_cargo_docente')?.setValidators(requiredValidator);
      getControl('id_tipo_docente_especifico')?.setValidators(requiredValidator);
      getControl('horas_academicas')?.setValidators(Validators.min(0));
      getControl('horas_administrativas')?.setValidators(Validators.min(0));
      getControl('id_turno')?.setValidators(requiredValidator); // Turno es requerido para docentes/administrativos/obreros

      // Habilitar y validar
      docenteControls.forEach(name => {
        getControl(name)?.enable();
        getControl(name)?.updateValueAndValidity();
      });

    } else if (tipoPersonalId === TIPO_PERSONAL.ADMINISTRATIVO) {

      getControl('id_cargo_administrativo')?.setValidators(requiredValidator);
      getControl('horas_administrativas')?.setValidators(Validators.min(0));
      getControl('id_turno')?.setValidators(requiredValidator);

      // Habilitar y validar
      administrativoControls.forEach(name => {
        getControl(name)?.enable();
        getControl(name)?.updateValueAndValidity();
      });

    } else if (tipoPersonalId === TIPO_PERSONAL.OBRERO) {

      getControl('id_cargo_obrero')?.setValidators(requiredValidator);
      getControl('id_grado_obrero')?.setValidators(requiredValidator);
      getControl('horas_administrativas')?.setValidators(Validators.min(0));
      getControl('id_turno')?.setValidators(requiredValidator);

      // Habilitar y validar
      obreroControls.forEach(name => {
        getControl(name)?.enable();
        getControl(name)?.updateValueAndValidity();
      });

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

    estados$ = this.lookupService.getEstados().pipe(
      map(estados => (idEstado) ? estados.filter(e => e.id === idEstado) : estados)
    );

    switch (this.currentUser.cod_rol) {
      case ROLES.SUPER_ADMIN:
      case ROLES.ADMIN_STATE:

        municipios$ = this.lookupService.getMunicipios();
        circuitos$ = this.lookupService.getCircuitos();
        planteles$ = this.lookupService.getPlanteles();
        break;

      case ROLES.ADMIN_MUNICIPAL:

        municipios$ = (idEstado !== null && idEstado !== undefined) ? this.lookupService.getMunicipiosByEstado(idEstado) : of([]);
        circuitos$ = (idMunicipio !== null && idMunicipio !== undefined) ? this.lookupService.getCircuitosByMunicipio(idMunicipio) : of([]);
        planteles$ = (idMunicipio !== null && idMunicipio !== undefined) ? this.lookupService.getPlantelesByMunicipio(idMunicipio) : of([]);
        break;

      case ROLES.ADMIN_CIRCUITAL:

        municipios$ = (idEstado !== null && idEstado !== undefined) ? this.lookupService.getMunicipiosByEstado(idEstado) : of([]);
        circuitos$ = (idMunicipio !== null && idMunicipio !== undefined) ? this.lookupService.getCircuitosByMunicipio(idMunicipio) : of([]);

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

        municipios$ = (idEstado !== null && idEstado !== undefined) ? this.lookupService.getMunicipiosByEstado(idEstado) : of([]);
        circuitos$ = (idMunicipio !== null && idMunicipio !== undefined) ? this.lookupService.getCircuitosByMunicipio(idMunicipio) : of([]);

        planteles$ = this.lookupService.getPlanteles().pipe(

          catchError((err: HttpErrorResponse) => {
            console.error('ERROR EN API PLANTEL (Posible 403): Falló la carga inicial de planteles.', err.status, err.message);
            this.error = 'Error de permisos al cargar planteles asignados. Contacte a soporte.';
            return of([]);
          }),
          map(planteles => {

            if (!codPlantel) return [];

            const safeCodPlantel = codPlantel.trim().toLowerCase();

            const plantelesFiltrados = planteles.filter(p =>
              p.codigo_plantel && p.codigo_plantel.trim().toLowerCase() === safeCodPlantel
            );

            return plantelesFiltrados;
          })
        );
        break;
    }

    const geoLookups$ = forkJoin([estados$, municipios$, circuitos$, planteles$]);

    forkJoin([commonLookups$, geoLookups$]).subscribe({
      next: ([commonData, geoData]) => {
        [this.sexos, this.ubchs, this.comunas, this.consejosComunales, this.tiposPersonal, this.turnos, this.situacionesLaborales, this.cargosDocentes, this.cargosAdministrativos, this.cargosObreros, this.gradosObreros, this.tiposDocenteEspecificos] = commonData;
        [this.estados, this.municipios, this.circuitos, this.planteles] = geoData;

        if (this.currentUser && (this.currentUser.cod_rol === ROLES.ADMIN_SQUAD || this.currentUser.cod_rol === ROLES.STANDARD) && this.planteles.length === 1) {

          const plantelId = this.planteles[0].id_plantel;

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

    this.resetPersonalSpecificFields(true);

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
      let errorFound = false;
      Object.keys(this.formularioEmpleado.controls).forEach(key => {
        const control = this.formularioEmpleado.get(key);

        if (control && control.invalid && (control.touched || control.dirty)) {
          errorFound = true;
        }
      });
      if (!errorFound) {
      }

      this.error = 'Por favor, complete todos los campos requeridos y corrija los errores del formulario.';
      this.markAllAsTouched(this.formularioEmpleado);
      return;
    }

    let dataToSend = { ...this.formularioEmpleado.getRawValue() };

    dataToSend = this.sanitizeData(dataToSend);

    const plantelControl = this.formularioEmpleado.get('id_plantel');

    if (plantelControl?.disabled) {

      if (plantelControl.value === null || plantelControl.value === undefined) {
        this.error = 'Error de configuración: ID de plantel asignado no disponible.';
        return;
      }

      dataToSend.id_plantel = plantelControl.value;
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
            this.error = `Error al crear empleado: ${err.error?.msg || err.error?.details || err.message || 'Error de servidor desconocido'}.`;
          }
        });
    }
  }

  /**
   * Prepara el formulario para la edición de un empleado existente.
   */
  editarEmpleado(empleado: Empleado): void {
    if (!this.isAuthorized()) {
      this.error = 'Acceso denegado. No tienes permisos para editar este empleado.';
      return;
    }

    this.modoEdicion = true;
    this.empleadoSeleccionadoId = empleado.id_empleado;

    this.patchFormValues(empleado);

    this.formularioEmpleado.updateValueAndValidity();

  }

  /**
   * Rellena el formulario con los valores de un empleado.
   */
private patchFormValues(empleado: Empleado): void {
  // Paso 1: Habilitar todos los controles específicos para que patchValue funcione
  this.resetPersonalSpecificFields(false);

  // Paso 2: Aplicar los valores comunes y específicos (excepto sufijo docente)
  this.formularioEmpleado.patchValue({
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
    id_cargo_administrativo: empleado.id_cargo_administrativo,
    id_grado_obrero: empleado.id_grado_obrero,
    id_cargo_obrero: empleado.id_cargo_obrero,
    id_tipo_docente_especifico: empleado.id_tipo_docente_especifico || null,
  }, { emitEvent: false });

  // Paso 2.1: Cargar descripción de situación laboral (solo informativa)
  const idSit = empleado.id_situacion_laboral;
  if (idSit !== null && this.situacionesLaborales.length > 0) {
    const situacion = this.situacionesLaborales.find(s => s.id === idSit);
    this.formularioEmpleado.get('descripcion_situacion_laboral')?.setValue(situacion?.descripcion || '');
  }

  // Paso 3: Reconfigurar validadores
  const tipoPersonalId = this.formularioEmpleado.get('id_tipo_personal')?.value;
  if (tipoPersonalId !== null) {
    this.configurePersonalSpecificFields(tipoPersonalId);
  }

  // Paso 4: Si es docente, cargar sufijos según el cargo y setear el valor
  if (empleado.id_tipo_personal === this.TIPO_PERSONAL.DOCENTE && empleado.id_cargo_docente) {
    this.lookupService.getCodigosByCargoDocente(empleado.id_cargo_docente).subscribe(codigos => {
      this.codigoSufijoDocente = codigos;
      this.formularioEmpleado.get('codigo_docente_sufijo')?.enable({ emitEvent: false });

      const sufijoValido = codigos.find(c => c.codigo_nomina === empleado.codigo_docente_sufijo);
      if (sufijoValido) {
        this.formularioEmpleado.get('codigo_docente_sufijo')?.setValue(sufijoValido.codigo_nomina, { emitEvent: false });
      }
    });
  }

  // Paso 5: Reaplicar filtro de cargos obrero
  if (empleado.id_tipo_personal === this.TIPO_PERSONAL.OBRERO && empleado.id_grado_obrero) {
    this.filtrarCargosObrero(empleado.id_grado_obrero);
    setTimeout(() => {
      this.formularioEmpleado.get('id_cargo_obrero')?.setValue(empleado.id_cargo_obrero, { emitEvent: false });
    }, 50);
  }

  this.formularioEmpleado.updateValueAndValidity();
}

eliminarEmpleado(id: number, nombreEmpleado: string): void {
  if (!this.isDeleteAuthorized()) {
    this.error = 'Acceso denegado. No tienes permisos para eliminar empleados.';
    return;
  }

  // Aquí puedes reemplazar confirm() por un modal personalizado si lo deseas
  if (confirm(`¿Estás seguro de que quieres eliminar al empleado ${nombreEmpleado}? 
  El registro será trasladado a la lista de eliminados.`)) {
    this.cargando = true;
    this.error = null;

    this.servicioEmpleado.eliminarEmpleado(id) // tu servicio ya apunta al DELETE /api/empleados/:id
      .subscribe({
        next: (res: any) => {
          this.cargando = false;
          this.cargarEmpleados(); // recarga la lista de empleados activos
          this.limpiarFormulario();
          this.error = res.msg || 'Empleado eliminado exitosamente.';
          setTimeout(() => this.error = null, 3000);
        },
        error: (err: HttpErrorResponse) => {
          this.cargando = false;
          this.error = `Error al eliminar empleado: ${err.error?.msg || err.message || 'Error de servidor desconocido'}.`;
        }
      });
  }
}

/*   eliminarEmpleado(id: number, nombreEmpleado: string): void {
    if (!this.isDeleteAuthorized()) {
      this.error = 'Acceso denegado. No tienes permisos para eliminar empleados.';
      return;
    }

    // NOTA: Se evita el uso de confirm() para usar una UI personalizada en un entorno iframe.
    // Dejamos el placeholder por ahora, pero se recomienda cambiar a un modal personalizado.
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
  } */

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
