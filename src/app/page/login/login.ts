// src/app/pages/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, } from '@angular/forms';

import { Api } from '../../core/api';
import { BackendMessageResponse } from '../../core/models/usuario.model';
import { catchError, finalize } from 'rxjs/operators';
import { of, EMPTY } from 'rxjs';
import { Router, RouterLink, ActivatedRoute } from '@angular/router'; // RouterLink es una directiva, Router es un servicio
import { Auth } from '../../core/services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginPayload, LoginResponse } from '../../core/models/login.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink //SÍ va aquí porque es una directiva. Router NO va aquí.
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  // Aquí comienza la única declaración de la clase
  loginForm: FormGroup;
  isLoading: boolean = false;
  message: string | null = null;
  // Tipo de mensaje para Bootstrap: 'success', 'danger', 'warning'
  messageType: 'success' | 'danger' | 'warning' | null = null;
  returnUrl: string = '/panel';

  constructor(
    private fb: FormBuilder,
    private apiService: Api,
    private authService: Auth,
    private router: Router, // Router se inyecta en el constructor.
    private route: ActivatedRoute // ActivatedRoute se inyecta en el constructor.
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', Validators.required],
      contrasena: ['', Validators.required],
    });
  }

  // Método OnInit requerido por la interfaz OnInit
  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/panel';
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  // Método onSubmit que se llama desde el formulario HTML
  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    this.message = null; // Limpiar mensaje anterior

    if (this.loginForm.valid) {
      this.isLoading = true;

      const payload: LoginPayload = this.loginForm.value;

      this.apiService
        .loginUser(payload)
        .pipe(
          finalize(() => (this.isLoading = false)),
          catchError((err: HttpErrorResponse) => {
            console.error(
              'DEBUG (LoginComponent): Error HttpErrorResponse COMPLETO recibido en catchError:',
              err
            );

            const backendResponseError =
              err.error && typeof err.error === 'object'
                ? (err.error as BackendMessageResponse)
                : {
                  msg: 'Error inesperado del backend o formato incorrecto.',
                  usuario: undefined,
                };
            if (
              err.status === 403 &&
              backendResponseError?.msg &&
              backendResponseError.msg.includes('pendiente de aprobación')
            ) {
              setTimeout(() => {
                const navState = {
                  usuario:
                    backendResponseError.usuario?.usuario || payload.usuario,
                  correo:
                    backendResponseError.usuario?.correo || 'No disponible',
                  nombre: backendResponseError.usuario?.nombre || '',
                  apellido: backendResponseError.usuario?.apellido || '',
                  mensaje: backendResponseError.msg,
                };
                this.router.navigate(['/usuario-pendiente'], {
                  state: navState,
                });
              }, 0);

              return EMPTY;
            } else {
              this.mostrarMensaje(
                backendResponseError?.msg ||
                'Error al iniciar sesión. Verifica tus credenciales.',
                'danger'
              );
              return EMPTY;
            }
          })
        )
        .subscribe((response: LoginResponse | null) => {
          if (response && response.token) {
            if (response.usuario) {
              this.authService.saveAuthData(response.token, response.usuario);
              this.mostrarMensaje(
                '¡Inicio de sesión exitoso! Redirigiendo...',
                'success'
              );
              this.router.navigateByUrl(this.returnUrl);
            } else {
              console.error(
                'LoginComponent: Inicio de sesión exitoso, pero el objeto de usuario en la respuesta es nulo o indefinido.'
              );
              this.mostrarMensaje(
                'Inicio de sesión exitoso, pero no se pudo obtener información completa del usuario.',
                'warning'
              );
              this.router.navigateByUrl(this.returnUrl);
            }
          } else {
            console.error(
              'LoginComponent: El flujo de login terminó inesperadamente sin token.'
            );
            this.mostrarMensaje('Error inesperado durante el login.', 'danger');
          }
        });
    } else {
      this.mostrarMensaje(
        'Por favor, ingresa tu usuario y contraseña.',
        'warning'
      );
    }
  }

  // Método para mostrar mensajes en la UI
  mostrarMensaje(
    mensaje: string,
    tipo: 'success' | 'danger' | 'warning'
  ): void {
    this.message = mensaje;
    this.messageType = tipo;
    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 5000);
  }
}
