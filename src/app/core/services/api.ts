// src/app/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { RolPublico } from '../models/rol-publico.model';
import { BackendMessageResponse, RegistroResponse, RegistroUsuarioPayload, Usuario } from '../models/usuario.model';
import { Empleado } from '../models/empleado.model';
import { Plantel } from '../models/plantel.model';
import { CargosObreros } from '../models/cargos-obreros.model';
import { GradosObreros } from '../models/grados-obreros.model';
import { DocentesEspecificos } from '../models/docentes-especificos.model';
import { CargoDocentes } from '../models/cargo-docentes.model';
import { CargoAdministrativos } from '../models/cargo-administrativos.model';
import { TiposPersonal } from '../models/tipos-personal.model';
import { Sexo } from '../models/sexo.model';
import { Circuito } from '../models/circuito.model';
import { Comunas } from '../models/comunas.model';
import { ConsejoComunales } from '../models/consejo-comunales.model';
import { Denominaciones } from '../models/denominaciones.model';
import { Dependencias } from '../models/dependencias.model';
import { Modalidades } from '../models/modalidades.model';
import { Niveles } from '../models/niveles.model';
import { SituacionLaboral } from '../models/situacion-laboral.model';
import { Turnos } from '../models/turnos.model';
import { Ubch } from '../models/ubch.model';
import { Territorio } from '../models/territorio.model';
import { Parroquia } from '../models/parroquia.model';
import { Municipio } from '../models/municipio.model';
import { Estado } from '../models/estado.model';
import { LoginPayload, LoginResponse } from '../models/login.model';


@Injectable({
  providedIn: 'root'
})
export class Api {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  registerUser(data: RegistroUsuarioPayload): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(`${this.apiUrl}/auth/register`, data).pipe(catchError(this.handleError));
  }

  loginUser(data: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, data).pipe(catchError(this.handleError));
  }

  getRolesPublicos(): Observable<RolPublico[]> {
    return this.http.get<RolPublico[]>(`${this.apiUrl}/auth/roles_public`).pipe(catchError(this.handleError));
  }

  getEstados(): Observable<Estado[]> {
    return this.http.get<Estado[]>(`${this.apiUrl}/estados`).pipe(catchError(this.handleError));
  }

  getMunicipios(estadoId: number): Observable<Municipio[]> {
    return this.http.get<Municipio[]>(`${this.apiUrl}/municipios/estados/${estadoId}`).pipe(catchError(this.handleError));
  }

  getTodosMunicipios(): Observable<Municipio[]> {
    return this.http.get<Municipio[]>(`${this.apiUrl}/municipios`).pipe(catchError(this.handleError));
  }

  getTodasParroquias(): Observable<Parroquia[]> {
    return this.http.get<Parroquia[]>(`${this.apiUrl}/parroquias`).pipe(catchError(this.handleError));
  }

  getUbchs(): Observable<Ubch[]> {
    return this.http.get<Ubch[]>(`${this.apiUrl}/ubchs`).pipe(catchError(this.handleError));
  }
  
  getComunas(): Observable<Comunas[]> {
    return this.http.get<Comunas[]>(`${this.apiUrl}/comunas`).pipe(catchError(this.handleError));
  }
  
  getConsejosComunales(): Observable<ConsejoComunales[]> {
    return this.http.get<ConsejoComunales[]>(`${this.apiUrl}/consejos_comunales`).pipe(catchError(this.handleError));
  }
  
  getDependenciaPlantel(): Observable<Dependencias[]> {
    return this.http.get<Dependencias[]>(`${this.apiUrl}/dependencias_plantel`).pipe(catchError(this.handleError));
  }
  
  getDenominacionPlantel(): Observable<Denominaciones[]> {
    return this.http.get<Denominaciones[]>(`${this.apiUrl}/denominaciones_plantel`).pipe(catchError(this.handleError));
  }
  
  getNivelesPlantel(): Observable<Niveles[]> {
    return this.http.get<Niveles[]>(`${this.apiUrl}/niveles_plantel`).pipe(catchError(this.handleError));
  }
  
  getModalidadPlantel(): Observable<Modalidades[]> {
    return this.http.get<Modalidades[]>(`${this.apiUrl}/modalidades_plantel`).pipe(catchError(this.handleError));
  }
  
  getTurnos(): Observable<Turnos[]> {
    return this.http.get<Turnos[]>(`${this.apiUrl}/turnos`).pipe(catchError(this.handleError));
  }
  
  getSituacionesLaborales(): Observable<SituacionLaboral[]> {
    return this.http.get<SituacionLaboral[]>(`${this.apiUrl}/situaciones_laborales`).pipe(catchError(this.handleError));
  }
  
  getUbicacionPlantel(): Observable<Territorio[]> {
    return this.http.get<Territorio[]>(`${this.apiUrl}/ubicaciones_plantel`).pipe(catchError(this.handleError));
  }
  
  getSexos(): Observable<Sexo[]> {
    return this.http.get<Sexo[]>(`${this.apiUrl}/sexos`).pipe(catchError(this.handleError));
  }
  
  getAllCircuitos(): Observable<Circuito[]> {
    return this.http.get<Circuito[]>(`${this.apiUrl}/circuitos`).pipe(catchError(this.handleError));
  }

  getCircuitosPorMunicipio(municipioId: number): Observable<Circuito[]> {
    return this.http.get<Circuito[]>(`${this.apiUrl}/circuitos/municipios/${municipioId}`).pipe(catchError(this.handleError));
  }

  getPlanteles(municipioId: number): Observable<Plantel[]> {
    return this.http.get<Plantel[]>(`${this.apiUrl}/planteles/municipios/${municipioId}`).pipe(catchError(this.handleError));
  }

  // --- NUEVO MÉTODO: Obtener planteles por ID de Circuito ---
  getPlantelesPorCircuito(id_circuito: number): Observable<Plantel[]> {
    return this.http.get<Plantel[]>(`${this.apiUrl}/planteles/circuito/${id_circuito}`).pipe(catchError(this.handleError));
  }

  getAllPlantelesWithDetails(): Observable<Plantel[]> {
    return this.http.get<Plantel[]>(`${this.apiUrl}/planteles`).pipe(catchError(this.handleError));
  }

  getPlantelById(id: number): Observable<Plantel> {
    return this.http.get<Plantel>(`${this.apiUrl}/planteles/${id}`).pipe(catchError(this.handleError));
  }

  createPlantel(data: Plantel): Observable<BackendMessageResponse> {
    return this.http.post<BackendMessageResponse>(`${this.apiUrl}/planteles`, data).pipe(catchError(this.handleError));
  }

  updatePlantel(id: number, data: Plantel): Observable<BackendMessageResponse> {
    return this.http.put<BackendMessageResponse>(`${this.apiUrl}/planteles/${id}`, data).pipe(catchError(this.handleError));
  }

  deletePlantel(id: number): Observable<BackendMessageResponse> {
    return this.http.delete<BackendMessageResponse>(`${this.apiUrl}/planteles/${id}`).pipe(catchError(this.handleError));
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/users`).pipe(catchError(this.handleError));
  }

  updateUsuario(id: number, data: Partial<Usuario>): Observable<BackendMessageResponse> {
    return this.http.put<BackendMessageResponse>(`${this.apiUrl}/users/${id}`, data).pipe(catchError(this.handleError));
  }

  deleteUsuario(id: number): Observable<BackendMessageResponse> {
    return this.http.delete<BackendMessageResponse>(`${this.apiUrl}/users/${id}`).pipe(catchError(this.handleError));
  }

  getEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${this.apiUrl}/empleados`).pipe(catchError(this.handleError));
  }

  getEmpleadoById(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.apiUrl}/empleados/${id}`).pipe(catchError(this.handleError));
  }

  createEmpleado(data: Empleado): Observable<Empleado> {
    return this.http.post<Empleado>(`${this.apiUrl}/empleados`, data).pipe(catchError(this.handleError));
  }

  updateEmpleado(id: number, data: Empleado): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.apiUrl}/empleados/${id}`, data).pipe(catchError(this.handleError));
  }

  deleteEmpleado(id: number): Observable<BackendMessageResponse> {
    return this.http.delete<BackendMessageResponse>(`${this.apiUrl}/empleados/${id}`).pipe(catchError(this.handleError));
  }

  getTiposPersonal(): Observable<TiposPersonal[]> {
    return this.http.get<TiposPersonal[]>(`${this.apiUrl}/tipos_personal`).pipe(catchError(this.handleError));
  }

  getGradosObreros(): Observable<GradosObreros[]> {
    return this.http.get<GradosObreros[]>(`${this.apiUrl}/grado_obrero`).pipe(catchError(this.handleError));
  }

  getTiposDocenteEspecifico(): Observable<DocentesEspecificos[]> {
    return this.http.get<DocentesEspecificos[]>(`${this.apiUrl}/tipos_docente_especificos`).pipe(catchError(this.handleError));
  }

  getCargosDocentes(): Observable<CargoDocentes[]> {
    return this.http.get<CargoDocentes[]>(`${this.apiUrl}/cargos_docentes`).pipe(catchError(this.handleError));
  }

  getCargosAdministrativos(): Observable<CargoAdministrativos[]> {
    return this.http.get<CargoAdministrativos[]>(`${this.apiUrl}/cargos_administrativos`).pipe(catchError(this.handleError));
  }

  getCargosObreros(): Observable<CargosObreros[]> {
    return this.http.get<CargosObreros[]>(`${this.apiUrl}/cargos_obreros`).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => error);
  }
}

