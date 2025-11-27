import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Plantel } from '../models/plantel.model';
import { CargosObreros } from '../models/cargos-obreros.model';
import { Estado } from '../models/estado.model';
import { Municipio } from '../models/municipio.model';
import { Circuito } from '../models/circuito.model';


export interface LookupItem {
  id: number | string;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class LookupService {

  private baseBackendUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }


  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(`LookupService Error: ${errorMessage}`);
    return throwError(() => new Error(errorMessage));
  }

  getSexos(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/sexos`).pipe(
      catchError(this.handleError)
    );
  }

  getUbchs(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/ubchs`).pipe(
      catchError(this.handleError)
    );
  }

  getComunas(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/comunas`).pipe(
      catchError(this.handleError)
    );
  }

  getConsejosComunales(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/consejos_comunales`).pipe(
      catchError(this.handleError)
    );
  }

  getTiposPersonal(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/tipos_personal`).pipe(
      catchError(this.handleError)
    );
  }

  getTurnos(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/turnos`).pipe(
      catchError(this.handleError)
    );
  }

  getSituacionesLaborales(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/situaciones_laborales`).pipe(
      catchError(this.handleError)
    );
  }

  getPlanteles(): Observable<Plantel[]> {
    return this.http.get<Plantel[]>(`${this.baseBackendUrl}/planteles`).pipe(
      catchError(this.handleError)
    );
  }

  getPlantelesByMunicipio(municipioId: number): Observable<Plantel[]> {
    return this.http.get<Plantel[]>(`${this.baseBackendUrl}/planteles/municipios/${municipioId}`).pipe(
      catchError(this.handleError)
    );
  }

  getPlantelesByEstado(estadoId: number): Observable<Plantel[]> {
    return this.http.get<Plantel[]>(`${this.baseBackendUrl}/planteles/estados/${estadoId}`).pipe(
      catchError(this.handleError)
    );
  }

  getPlantelesByCircuito(circuitoId: number): Observable<Plantel[]> {
    return this.http.get<Plantel[]>(`${this.baseBackendUrl}/planteles/circuito/${circuitoId}`).pipe(
      catchError(this.handleError)
    );
  }

  getPlantelByCodigo(codigoPlantel: string): Observable<Plantel> {
    return this.http.get<Plantel>(`${this.baseBackendUrl}/planteles/by-codigo/${codigoPlantel}`).pipe(
      catchError(this.handleError)
    );
  }

  getCargosDocentes(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/cargos_docentes`).pipe(
      catchError(this.handleError)
    );
  }

  getCargosAdministrativos(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/cargos_administrativos`).pipe(
      catchError(this.handleError)
    );
  }

  getCargosObreros(): Observable<CargosObreros[]> {
    return this.http.get<CargosObreros[]>(`${this.baseBackendUrl}/cargos_obreros`).pipe(
      catchError(this.handleError)
    );
  }

  getGradosObreros(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/grado_obrero`).pipe(
      catchError(this.handleError)
    );
  }

  getDenominacionesPlantel(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/denominaciones_plantel`).pipe(
      catchError(this.handleError)
    );
  }

  getDependenciasPlantel(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/dependencias_plantel`).pipe(
      catchError(this.handleError)
    );
  }

  getUbicacionesPlantel(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/ubicaciones_plantel`).pipe(
      catchError(this.handleError)
    );
  }

  getNivelesPlantel(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/niveles_plantel`).pipe(
      catchError(this.handleError)
    );
  }

  getModalidadesPlantel(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/modalidades_plantel`).pipe(
      catchError(this.handleError)
    );
  }

  getEstados(): Observable<Estado[]> {
    return this.http.get<Estado[]>(`${this.baseBackendUrl}/estados`).pipe(
      catchError(this.handleError)
    );
  }

  getMunicipios(): Observable<Municipio[]> {
    return this.http.get<Municipio[]>(`${this.baseBackendUrl}/municipios`).pipe(
      catchError(this.handleError)
    );
  }

  getMunicipiosByEstado(estadoId: number): Observable<Municipio[]> {
    return this.http.get<Municipio[]>(`${this.baseBackendUrl}/municipios/estados/${estadoId}`).pipe(
      catchError(this.handleError)
    );
  }

  getParroquiasByMunicipio(municipioId: number): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/parroquias/by-municipio/${municipioId}`).pipe(
      catchError(this.handleError)
    );
  }

  getTiposDocenteEspecificos(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseBackendUrl}/tipos_docente_especificos`).pipe(
      catchError(this.handleError)
    );
  }

  getCircuitos(): Observable<Circuito[]> {
    return this.http.get<Circuito[]>(`${this.baseBackendUrl}/circuitos`).pipe(
      catchError(this.handleError)
    );
  }

  getCircuitosByMunicipio(municipioId: number): Observable<Circuito[]> {
    return this.http.get<Circuito[]>(`${this.baseBackendUrl}/circuitos/municipio/${municipioId}`).pipe(
      catchError(this.handleError)
    );
  }

  getCircuitosByEstado(estadoId: number): Observable<Circuito[]> {
    return this.http.get<Circuito[]>(`${this.baseBackendUrl}/circuitos/estados/${estadoId}`).pipe(
      catchError(this.handleError)
    );
  }
}

