import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl, FormsModule } from '@angular/forms';
import { forkJoin, Observable, Subscription, of } from 'rxjs';
import { filter, map, catchError } from 'rxjs/operators';
import { ROLES, TIPO_PERSONAL } from '../../core/constants/constantes';
import { LookupService } from '../../core/services/lookup';
import { Empleado } from '../../core/models/empleado.model';
import { Usuario } from '../../core/models/usuario.model';
import { Plantel } from '../../core/models/plantel.model';
import { CargosObreros } from '../../core/models/cargos-obreros.model';
import { Estado } from '../../core/models/estado.model';
import { Municipio } from '../../core/models/municipio.model';
import { Circuito } from '../../core/models/circuito.model';
import { Auth } from '../../core/services/auth';
import { ServicioEmpleado } from '../../core/services/empleado';
import { CargoAdministrativos } from '../../core/models/cargo-administrativos.model';
import { Sexo } from '../../core/models/sexo.model';
import { Ubch } from '../../core/models/ubch.model';
import { Comunas } from '../../core/models/comunas.model';
import { ConsejoComunales } from '../../core/models/consejo-comunales.model';
import { TiposPersonal } from '../../core/models/tipos-personal.model';
import { Turnos } from '../../core/models/turnos.model';
import { SituacionLaboral } from '../../core/models/situacion-laboral.model';
import { CargoDocentes } from '../../core/models/cargo-docentes.model';
import { DocentesEspecificos } from '../../core/models/docentes-especificos.model';
import { GradosObreros } from '../../core/models/grados-obreros.model';
import { CodigoSufijoDocente } from '../../core/models/codigo-sufijo-docente.model';

declare var bootstrap: any;

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './empleados.html',
  styleUrls: ['./empleados.css'],
})
export class Empleados implements OnInit, OnDestroy {

  private rolUsuarioActual: string = '';

  empleados: Empleado[] = [];
  cargando = false;
  error: string | null = null;

  formularioEmpleado!: FormGroup;
  modoEdicion = false;
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


  // Modal eliminar
  motivoSeleccionado = '';
  empleadoSeleccionadoNombre = '';

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

    this.rolUsuarioActual = String(this.currentUser.cod_rol ?? '');

    this.initForm();
    this.loadLookupData();
    this.setupConditionalFormLogic();

    const subGrado = this.formularioEmpleado.get('id_grado_obrero')?.valueChanges.subscribe(gradoId => {
      this.filtrarCargosObrero(gradoId);
    });
    if (subGrado) this.subscriptions.add(subGrado);

    const tipoPersonalInicial = this.formularioEmpleado.get('id_tipo_personal')?.value;
    if (tipoPersonalInicial === this.TIPO_PERSONAL.OBRERO) {
      const gradoInicial = this.formularioEmpleado.get('id_grado_obrero')?.value;
      this.filtrarCargosObrero(gradoInicial);
    }

    // Reglas: administrativo -> código automático según cargo
    const tipoPersonalControl = this.formularioEmpleado.get('id_tipo_personal');
    const cargoAdminControl = this.formularioEmpleado.get('id_cargo_administrativo');
    const codigoAdminControl = this.formularioEmpleado.get('codigo_administrativo');

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
    if (subCargoDocente) this.subscriptions.add(subCargoDocente);

    const tipoDocenteControl = this.formularioEmpleado.get('id_tipo_docente_especifico');
    if (tipoDocenteControl) {
      const subTipoDocente = tipoDocenteControl.valueChanges.subscribe(tipo => {
        ['grado_imparte', 'seccion_grado', 'area_imparte', 'anio_imparte', 'seccion_anio', 'materia_especialidad', 'periodo_grupo']
          .forEach(name => this.formularioEmpleado.get(name)?.disable({ emitEvent: false }));

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
    if (subSituacion) this.subscriptions.add(subSituacion);

    this.cargarEmpleados();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

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

      id_cargo_docente: [null],
      codigo_docente_sufijo: [''],
      id_tipo_docente_especifico: [null],

      id_cargo_administrativo: [null],
      codigo_administrativo: [{ value: null, disabled: true }],
      id_cargo_obrero: [null],
      id_grado_obrero: [null],

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
    });

    if (this.currentUser && (this.currentUser.cod_rol === ROLES.ADMIN_SQUAD || this.currentUser.cod_rol === ROLES.STANDARD)) {
      this.formularioEmpleado.get('id_plantel')?.disable();
    }
  }

  puedeVerFormulario(): boolean {
    if (!this.currentUser) return false;
    const rolesPermitidos = [ROLES.SUPER_ADMIN, ROLES.ADMIN_SQUAD, ROLES.STANDARD]; // 👈 aquí pones los dos roles que quieras
    return rolesPermitidos.includes(this.currentUser.cod_rol);
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
          control.disable({ emitEvent: false });
          control.setValue(control.value === '' ? '' : null, { emitEvent: false });
        } else {
          control.enable({ emitEvent: false });
        }
      }
    });
  }

  private configurePersonalSpecificFields(tipoPersonalId: number): void {
    const requiredValidator = Validators.required;
    const getControl = (name: string): AbstractControl | null => this.formularioEmpleado.get(name);

    const docenteControls = ['id_cargo_docente', 'id_tipo_docente_especifico', 'horas_academicas', 'horas_administrativas', 'id_turno'];
    const administrativoControls = ['id_cargo_administrativo', 'horas_administrativas', 'id_turno'];
    const obreroControls = ['id_cargo_obrero', 'id_grado_obrero', 'horas_administrativas', 'id_turno'];

    const allSpecificControls = [
      ...docenteControls,
      ...administrativoControls,
      'grado_imparte', 'seccion_grado', 'area_imparte', 'anio_imparte', 'seccion_anio', 'materia_especialidad', 'periodo_grupo'
    ];

    allSpecificControls.forEach(name => {
      const control = getControl(name);
      control?.clearValidators();
      control?.updateValueAndValidity();
    });

    if (tipoPersonalId === TIPO_PERSONAL.DOCENTE) {
      getControl('id_cargo_docente')?.setValidators(requiredValidator);
      getControl('id_tipo_docente_especifico')?.setValidators(requiredValidator);
      getControl('horas_academicas')?.setValidators(Validators.min(0));
      getControl('horas_administrativas')?.setValidators(Validators.min(0));
      getControl('id_turno')?.setValidators(requiredValidator);

      docenteControls.forEach(name => {
        getControl(name)?.enable();
        getControl(name)?.updateValueAndValidity();
      });

    } else if (tipoPersonalId === TIPO_PERSONAL.ADMINISTRATIVO) {
      getControl('id_cargo_administrativo')?.setValidators(requiredValidator);
      getControl('horas_administrativas')?.setValidators(Validators.min(0));
      getControl('id_turno')?.setValidators(requiredValidator);

      administrativoControls.forEach(name => {
        getControl(name)?.enable();
        getControl(name)?.updateValueAndValidity();
      });

    } else if (tipoPersonalId === TIPO_PERSONAL.OBRERO) {
      getControl('id_cargo_obrero')?.setValidators(requiredValidator);
      getControl('id_grado_obrero')?.setValidators(requiredValidator);
      getControl('horas_administrativas')?.setValidators(Validators.min(0));
      getControl('id_turno')?.setValidators(requiredValidator);

      obreroControls.forEach(name => {
        getControl(name)?.enable();
        getControl(name)?.updateValueAndValidity();
      });
    }
  }

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
        municipios$ = (idEstado != null) ? this.lookupService.getMunicipiosByEstado(idEstado) : of([]);
        circuitos$ = (idMunicipio != null) ? this.lookupService.getCircuitosByMunicipio(idMunicipio) : of([]);
        planteles$ = (idMunicipio != null) ? this.lookupService.getPlantelesByMunicipio(idMunicipio) : of([]);
        break;

      case ROLES.ADMIN_CIRCUITAL:
        municipios$ = (idEstado != null) ? this.lookupService.getMunicipiosByEstado(idEstado) : of([]);
        circuitos$ = (idMunicipio != null) ? this.lookupService.getCircuitosByMunicipio(idMunicipio) : of([]);
        if (idCircuito != null) {
          planteles$ = this.lookupService.getPlantelesByCircuito(idCircuito);
        } else if (idMunicipio != null) {
          planteles$ = this.lookupService.getPlantelesByMunicipio(idMunicipio);
        } else {
          planteles$ = of([]);
        }
        break;

      case ROLES.ADMIN_SQUAD:
      case ROLES.STANDARD:
        municipios$ = (idEstado != null) ? this.lookupService.getMunicipiosByEstado(idEstado) : of([]);
        circuitos$ = (idMunicipio != null) ? this.lookupService.getCircuitosByMunicipio(idMunicipio) : of([]);

        planteles$ = this.lookupService.getPlanteles().pipe(
          catchError((err: HttpErrorResponse) => {
            console.error('ERROR EN API PLANTEL (Posible 403): Falló la carga inicial de planteles.', err.status, err.message);
            this.error = 'Error de permisos al cargar planteles asignados. Contacte a soporte.';
            return of([]);
          }),
          map(planteles => {
            if (!codPlantel) return [];
            const safeCodPlantel = codPlantel.trim().toLowerCase();
            return planteles.filter(p =>
              p.codigo_plantel && p.codigo_plantel.trim().toLowerCase() === safeCodPlantel
            );
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

    let dataToSend = { ...this.formularioEmpleado.getRawValue() };
    dataToSend = this.sanitizeData(dataToSend);

    const plantelControl = this.formularioEmpleado.get('id_plantel');
    if (plantelControl?.disabled) {
      if (plantelControl.value == null) {
        this.error = 'Error de configuración: ID de plantel asignado no disponible.';
        return;
      }
      dataToSend.id_plantel = plantelControl.value;
    }

    this.cargando = true;
    this.error = null;

    if (this.modoEdicion && this.empleadoSeleccionadoId !== null) {
      this.servicioEmpleado.actualizarEmpleado(this.empleadoSeleccionadoId, dataToSend).subscribe({
        next: () => {
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
      this.servicioEmpleado.crearEmpleado(dataToSend).subscribe({
        next: () => {
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

  private patchFormValues(empleado: Empleado): void {
    this.resetPersonalSpecificFields(false);

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

    const idSit = empleado.id_situacion_laboral;
    if (idSit !== null && this.situacionesLaborales.length > 0) {
      const situacion = this.situacionesLaborales.find(s => s.id === idSit);
      this.formularioEmpleado.get('descripcion_situacion_laboral')?.setValue(situacion?.descripcion || '');
    }

    const tipoPersonalId = this.formularioEmpleado.get('id_tipo_personal')?.value;
    if (tipoPersonalId !== null) {
      this.configurePersonalSpecificFields(tipoPersonalId);
    }

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

    if (empleado.id_tipo_personal === this.TIPO_PERSONAL.OBRERO && empleado.id_grado_obrero) {
      this.filtrarCargosObrero(empleado.id_grado_obrero);
      setTimeout(() => {
        this.formularioEmpleado.get('id_cargo_obrero')?.setValue(empleado.id_cargo_obrero, { emitEvent: false });
      }, 50);
    }

    this.formularioEmpleado.updateValueAndValidity();
  }

  abrirModalEliminar(id: number, nombre: string): void {
    this.empleadoSeleccionadoId = id;
    this.empleadoSeleccionadoNombre = nombre;
    this.motivoSeleccionado = '';

    const modalEl = document.getElementById('modalEliminarEmpleado');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  confirmarEliminar(): void {
    if (!this.motivoSeleccionado) {
      this.error = 'Debe seleccionar un motivo antes de continuar.';
      return;
    }

    this.cargando = true;
    this.error = null;

    this.servicioEmpleado.eliminarEmpleado(this.empleadoSeleccionadoId!, this.motivoSeleccionado).subscribe({
      next: (res: any) => {
        this.cargando = false;
        this.cargarEmpleados();
        this.limpiarFormulario();
        this.error = res.msg || 'Empleado eliminado exitosamente.';
        setTimeout(() => this.error = null, 3000);

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminarEmpleado'));
        modal?.hide();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.error = `Error al eliminar empleado: ${err.error?.msg || err.message || 'Error de servidor desconocido'}.`;
      }
    });
  }

  cargarEmpleados(): void {
    this.cargando = true;
    this.error = null;

    this.servicioEmpleado.obtenerEmpleados().subscribe({
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

  markAllAsTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markAllAsTouched(control);
      }
    });
  }

  filtrarCargosObrero(gradoId: number | null): void {
    this.formularioEmpleado.get('id_cargo_obrero')?.setValue(null, { emitEvent: false });
    if (!gradoId) {
      this.cargosObrerosFiltrados = [];
      return;
    }
    this.cargosObrerosFiltrados = this.cargosObreros.filter(cargo => cargo.id_grado_obrero === gradoId);
  }

// empleados.component.ts

puedeVerAcciones(): boolean {
    // 1. Convertir el valor a número
    const rolNumerico = Number(this.rolUsuarioActual); 

    // 3. La lógica de comparación
    const tienePermiso = rolNumerico === ROLES.ADMIN_SQUAD
           || 
                         rolNumerico === ROLES.STANDARD
    /*                           ||
                         rolNumerico === ROLES.ADMIN_MUNICIPAL  ||
                         rolNumerico === ROLES.ADMIN_CIRCUITAL; */
                         
    
    
    return tienePermiso;
}
}