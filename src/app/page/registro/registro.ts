import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { catchError, finalize, delay, debounceTime, take, switchMap, map } from 'rxjs/operators';
import { of, EMPTY, Observable } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { RolPublico } from '../../core/models/rol-publico.model';
import { Estado } from '../../core/models/estado.model';
import { Municipio } from '../../core/models/municipio.model';
import { Plantel } from '../../core/models/plantel.model';
import { Circuito } from '../../core/models/circuito.model';
import { Api } from '../../core/services/api';
import { ROLES } from '../../core/constants/constantes';
import { BackendMessageResponse, RegistroUsuarioPayload } from '../../core/models/usuario.model';


@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro implements OnInit {
  registroForm: FormGroup;
  rolesPublicos: RolPublico[] = [];
  estados: Estado[] = [];
  municipios: Municipio[] = [];
  planteles: Plantel[] = [];
  circuitos: Circuito[] = [];

  // Para almacenar todos los planteles del municipio seleccionado temporalmente y luego filtrar por circuito
  private allPlantelesInMunicipio: Plantel[] = [];

  isLoading: boolean = false;
  showEstadoField: boolean = false;
  showMunicipioField: boolean = false;
  showPlantelField: boolean = false;
  showCircuitoField: boolean = false;

  message: string | null = null;
  messageType: 'success' | 'danger' | 'warning' | null = null;

  emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  usuarioRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
  passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{8,12}$/;

  // Expresión regular para validar números de teléfono de operadores venezolanos.
  // Inicia con 0412, 0422, 0414, 0424, 0416 o 0426, seguido de 7 dígitos.
  telefonoRegex = /^(0412|0422|0414|0424|0416|0426)\d{7}$/;

  // Propiedades para controlar la visibilidad de las contraseñas
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private apiService: Api,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      tipo_cedula: [{ value: 'V', disabled: true }, Validators.required],
      cedula: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)], [this.cedulaExistenteValidator()]],
      telefono: ['', [Validators.required, Validators.pattern(this.telefonoRegex)]],
      correo: ['', [Validators.required, Validators.pattern(this.emailRegex)], [this.correoExistenteValidator()]],
      usuario: ['', [Validators.required, Validators.pattern(this.usuarioRegex)], [this.usuarioExistenteValidator()]],
      contrasena: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(12), Validators.pattern(this.passwordRegex)]],
      confirmarContrasena: ['', Validators.required],
      cod_rol_sugerido: ['', Validators.required],
      id_estado_sugerido: [{ value: null, disabled: true }],
      id_municipio_sugerido: [{ value: null, disabled: true }],
      id_circuito_sugerido: [{ value: null, disabled: true }],
      codigo_plantel_sugerido: [{ value: null, disabled: true }]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.cargarRolesPublicos();
    this.cargarEstados();

    // Lógica cuando cambia el Rol Sugerido
    this.registroForm.get('cod_rol_sugerido')?.valueChanges.subscribe(value => {
      const rolId = Number(value);
      console.log('DEBUG: Rol Sugerido cambiado a:', rolId, ' (', ROLES[rolId as unknown as keyof typeof ROLES], ')');

      // Reiniciamos todos los campos de ubicación y los ocultamos/deshabilitamos
      this.registroForm.get('id_estado_sugerido')?.setValue(null, { emitEvent: false });
      this.registroForm.get('id_municipio_sugerido')?.setValue(null, { emitEvent: false });
      this.registroForm.get('id_circuito_sugerido')?.setValue(null, { emitEvent: false });
      this.registroForm.get('codigo_plantel_sugerido')?.setValue(null, { emitEvent: false });
      this.municipios = [];
      this.circuitos = [];
      this.planteles = [];
      this.allPlantelesInMunicipio = []; // Limpiar planteles maestros

      this.registroForm.get('id_estado_sugerido')?.disable();
      this.registroForm.get('id_municipio_sugerido')?.disable();
      this.registroForm.get('id_circuito_sugerido')?.disable();
      this.registroForm.get('codigo_plantel_sugerido')?.disable();

      this.showEstadoField = false;
      this.showMunicipioField = false;
      this.showCircuitoField = false;
      this.showPlantelField = false;

      // Mostrar campo de estado si el rol NO es PENDING
      if (rolId !== ROLES.PENDING) {
        this.showEstadoField = true;
        this.registroForm.get('id_estado_sugerido')?.enable();
        console.log('DEBUG: showEstadoField = true. Campo de Estado habilitado.');
      }
    });

    // Lógica cuando cambia el Estado Sugerido
    this.registroForm.get('id_estado_sugerido')?.valueChanges.subscribe(estadoId => {
      const currentRolId = Number(this.registroForm.get('cod_rol_sugerido')?.value);
      console.log('DEBUG: Estado Sugerido cambiado a:', estadoId);
      console.log('DEBUG: Rol actual al cambiar Estado:', currentRolId, ' (', ROLES[currentRolId as unknown as keyof typeof ROLES], ')');

      // Reiniciamos municipios, circuitos y planteles cuando cambia el estado
      this.registroForm.get('id_municipio_sugerido')?.setValue(null, { emitEvent: false });
      this.registroForm.get('id_circuito_sugerido')?.setValue(null, { emitEvent: false });
      this.registroForm.get('codigo_plantel_sugerido')?.setValue(null, { emitEvent: false });
      this.municipios = [];
      this.circuitos = [];
      this.planteles = [];
      this.allPlantelesInMunicipio = []; // Limpiar planteles maestros

      this.registroForm.get('id_municipio_sugerido')?.disable();
      this.registroForm.get('id_circuito_sugerido')?.disable();
      this.registroForm.get('codigo_plantel_sugerido')?.disable();

      this.showMunicipioField = false;
      this.showCircuitoField = false;
      this.showPlantelField = false;

      // Mostrar y habilitar campo de municipio si el rol lo requiere
      const shouldShowMunicipio = estadoId && (currentRolId === ROLES.ADMIN_MUNICIPAL || currentRolId === ROLES.ADMIN_CIRCUITAL || currentRolId === ROLES.ADMIN_SQUAD || currentRolId === ROLES.STANDARD);
      console.log('DEBUG: Evaluación para mostrar Municipio:', shouldShowMunicipio, ' (estadoId:', estadoId, ', currentRolId:', currentRolId, ')');

      if (shouldShowMunicipio) {
        this.showMunicipioField = true;
        this.registroForm.get('id_municipio_sugerido')?.enable();
        this.cargarMunicipios(estadoId);
        console.log('DEBUG: showMunicipioField = true. Campo de Municipio habilitado. Cargando municipios.');
      } else {
        console.log('DEBUG: Condición para mostrar Municipio NO cumplida.');
      }
    });

    // Lógica cuando cambia el Municipio Sugerido
    this.registroForm.get('id_municipio_sugerido')?.valueChanges.subscribe(municipioId => {
      const currentRolId = Number(this.registroForm.get('cod_rol_sugerido')?.value);
      console.log('DEBUG: Municipio Sugerido cambiado a:', municipioId);
      console.log('DEBUG: Rol actual al cambiar Municipio:', currentRolId, ' (', ROLES[currentRolId as unknown as keyof typeof ROLES], ')');

      // Reiniciamos circuitos y planteles cuando cambia el municipio
      this.registroForm.get('id_circuito_sugerido')?.setValue(null, { emitEvent: false });
      this.registroForm.get('codigo_plantel_sugerido')?.setValue(null, { emitEvent: false });
      this.circuitos = [];
      this.planteles = [];
      this.allPlantelesInMunicipio = []; // Limpiar planteles maestros

      this.registroForm.get('id_circuito_sugerido')?.disable();
      this.registroForm.get('codigo_plantel_sugerido')?.disable();

      this.showCircuitoField = false;
      this.showPlantelField = false;

      // Mostrar y habilitar campo de circuito si el rol lo requiere (ADMIN_CIRCUITAL, ADMIN_SQUAD, STANDARD)
      const shouldShowCircuito = municipioId && (currentRolId === ROLES.ADMIN_CIRCUITAL || currentRolId === ROLES.ADMIN_SQUAD || currentRolId === ROLES.STANDARD);
      console.log('DEBUG: Evaluación para mostrar Circuito:', shouldShowCircuito, ' (municipioId:', municipioId, ', currentRolId:', currentRolId, ')');

      if (shouldShowCircuito) {
        this.showCircuitoField = true;
        this.registroForm.get('id_circuito_sugerido')?.enable();
        this.cargarCircuitos(municipioId);
        // Cargar todos los planteles del municipio aquí para el filtrado posterior por circuito
        this.cargarAllPlantelesInMunicipio(municipioId);
        console.log('DEBUG: showCircuitoField = true. Campo de Circuito habilitado. Cargando circuitos y planteles del municipio.');
      } else {
        console.log('DEBUG: Condición para mostrar Circuito NO cumplida.');
      }
    });

    // Lógica cuando cambia el Circuito Sugerido (NUEVO)
    this.registroForm.get('id_circuito_sugerido')?.valueChanges.subscribe(circuitoId => {
      const currentRolId = Number(this.registroForm.get('cod_rol_sugerido')?.value);
      console.log('DEBUG: Circuito Sugerido cambiado a:', circuitoId);
      console.log('DEBUG: Rol actual al cambiar Circuito:', currentRolId, ' (', ROLES[currentRolId as unknown as keyof typeof ROLES], ')');

      // Reiniciamos planteles cuando cambia el circuito
      this.registroForm.get('codigo_plantel_sugerido')?.setValue(null, { emitEvent: false });
      this.planteles = [];
      this.registroForm.get('codigo_plantel_sugerido')?.disable();

      this.showPlantelField = false;

      // Mostrar y habilitar campo de plantel si el rol lo requiere (ADMIN_SQUAD o STANDARD)
      const shouldShowPlantel = circuitoId && (currentRolId === ROLES.ADMIN_SQUAD || currentRolId === ROLES.STANDARD);
      console.log('DEBUG: Evaluación para mostrar Plantel:', shouldShowPlantel, ' (circuitoId:', circuitoId, ', currentRolId:', currentRolId, ')');

      if (shouldShowPlantel) {
        this.showPlantelField = true;
        this.registroForm.get('codigo_plantel_sugerido')?.enable();
        // Filtrar planteles cargados previamente por el circuito seleccionado
        this.planteles = this.allPlantelesInMunicipio.filter(p => p.id_circuito === Number(circuitoId));
        console.log('DEBUG: showPlantelField = true. Campo de Plantel habilitado. Filtrando planteles por circuito.');
      } else {
        console.log('DEBUG: Condición para mostrar Plantel NO cumplida.');
      }
    });
  }

  // Nuevo método para alternar la visibilidad de la contraseña
  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const passwordControl = form.get('contrasena');
    const confirmPasswordControl = form.get('confirmarContrasena');

    if (!passwordControl || !confirmPasswordControl) {
      return null;
    }

    if (confirmPasswordControl.value && passwordControl.value !== confirmPasswordControl.value) {
      confirmPasswordControl.setErrors({ 'mismatch': true });
      return { 'mismatch': true };
    } else {
      if (confirmPasswordControl.hasError('mismatch')) {
        confirmPasswordControl.setErrors(null);
      }
    }
    return null;
  }

  cargarRolesPublicos(): void {
    this.apiService.getRolesPublicos().subscribe({
      next: (data) => {
        this.rolesPublicos = data.filter(rol => rol.id !== ROLES.SUPER_ADMIN);
      },
      error: (err) => {
        this.mostrarMensaje(err.msg || 'Error al cargar roles.', 'danger');
        console.error('Error al cargar roles públicos:', err);
      }
    });
  }

  cargarEstados(): void {
    this.apiService.getEstados().subscribe({
      next: (data) => {
        this.estados = data;
      },
      error: (err) => {
        this.mostrarMensaje(err.msg || 'Error al cargar estados.', 'danger');
        console.error('Error al cargar estados:', err);
      }
    });
  }

  cargarMunicipios(estadoId: number): void {
    this.apiService.getMunicipios(estadoId).subscribe({
      next: (data) => {
        this.municipios = data;
      },
      error: (err) => {
        this.mostrarMensaje(err.msg || 'Error al cargar municipios.', 'danger');
        console.error('Error al cargar municipios:', err);
      }
    });
  }

  cargarCircuitos(municipioId: number): void {
    this.apiService.getCircuitosPorMunicipio(municipioId).subscribe({
      next: (data) => {
        this.circuitos = data;
      },
      error: (err) => {
        this.mostrarMensaje(err.msg || 'Error al cargar circuitos.', 'danger');
        console.error('Error al cargar circuitos:', err);
      }
    });
  }

  // Nuevo método para cargar todos los planteles de un municipio y guardarlos para filtrado
  cargarAllPlantelesInMunicipio(municipioId: number): void {
    this.apiService.getPlanteles(municipioId).subscribe({
      next: (data) => {
        this.allPlantelesInMunicipio = data; // Guardar todos los planteles del municipio
        // NOTA: No asignamos directamente a 'this.planteles' aquí,
        // ya que la lista final de planteles dependerá del circuito seleccionado.
      },
      error: (err) => {
        this.mostrarMensaje(err.msg || 'Error al cargar planteles del municipio.', 'danger');
        console.error('Error al cargar planteles del municipio:', err);
      }
    });
  }

  onSubmit(): void {
    this.registroForm.markAllAsTouched();
    this.isLoading = true;

    if (this.registroForm.valid) {
      const { confirmarContrasena, tipo_cedula, ...formData } = this.registroForm.getRawValue();

      const payload: RegistroUsuarioPayload = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        tipo_cedula: tipo_cedula,
        cedula: parseInt(formData.cedula, 10),
        telefono: formData.telefono,
        correo: formData.correo,
        usuario: formData.usuario,
        contrasena: formData.contrasena,
        cod_rol_sugerido: parseInt(formData.cod_rol_sugerido, 10),
        id_estado_sugerido: formData.id_estado_sugerido !== null && formData.id_estado_sugerido !== '' ? parseInt(formData.id_estado_sugerido, 10) : null,
        id_municipio_sugerido: formData.id_municipio_sugerido !== null && formData.id_municipio_sugerido !== '' ? parseInt(formData.id_municipio_sugerido, 10) : null,
        id_circuito_sugerido: formData.id_circuito_sugerido !== null && formData.id_circuito_sugerido !== '' ? parseInt(formData.id_circuito_sugerido, 10) : null,
        codigo_plantel_sugerido: formData.codigo_plantel_sugerido !== null && formData.codigo_plantel_sugerido !== '' ? formData.codigo_plantel_sugerido : null,
        fecha_registro: new Date().toISOString()
      };

      // 👇 Aquí agregas el log para ver el payload completo
      console.log('DEBUG: Payload enviado al backend:', payload);

      this.apiService.registerUser(payload)
        .pipe(
          delay(1000),
          finalize(() => this.isLoading = false),
          catchError((err: BackendMessageResponse) => {
            this.mostrarMensaje(err.msg || 'Error al registrar el usuario.', 'danger');
            return EMPTY;
          })
        )
        .subscribe(response => {
          if (response) {
            this.mostrarMensaje(response.msg, 'success');
            this.router.navigate(['/login']);
          }
        });
    } else {
      this.isLoading = false;
      this.mostrarMensaje('Por favor, completa todos los campos requeridos correctamente.', 'warning');
    }
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'danger' | 'warning'): void {
    this.message = mensaje;
    this.messageType = tipo;
    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 5000);
  }

  // --- VALIDACIONES ASÍNCRONAS ---

  private cedulaExistenteValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) return of(null);
      return of(control.value).pipe(
        debounceTime(500),
        switchMap(cedula => this.apiService.checkCedulaExists(cedula)),
        map(existe => existe ? { cedulaTomada: true } : null),
        take(1)
      );
    };
  }

  private correoExistenteValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) return of(null);
      return of(control.value).pipe(
        debounceTime(500),
        switchMap(correo => this.apiService.checkEmailExists(correo)),
        map(existe => existe ? { emailTomado: true } : null),
        take(1)
      );
    };
  }

  private usuarioExistenteValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) return of(null);
      return of(control.value).pipe(
        debounceTime(500),
        switchMap(usuario => this.apiService.checkUserExists(usuario)),
        map(existe => existe ? { usuarioTomado: true } : null),
        take(1)
      );
    };
  }
}