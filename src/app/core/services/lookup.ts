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
import { Sexo } from '../models/sexo.model';
import { Ubch } from '../models/ubch.model';
import { Comunas } from '../models/comunas.model';
import { ConsejoComunales } from '../models/consejo-comunales.model';
import { TiposPersonal } from '../models/tipos-personal.model';
import { Turnos } from '../models/turnos.model';
import { SituacionLaboral } from '../models/situacion-laboral.model';
import { CargoDocentes } from '../models/cargo-docentes.model';
import { CargoAdministrativos } from '../models/cargo-administrativos.model';
import { GradosObreros } from '../models/grados-obreros.model';
import { DocentesEspecificos } from '../models/docentes-especificos.model';
import { Denominaciones } from '../models/denominaciones.model';
import { Dependencias } from '../models/dependencias.model';
import { Territorio } from '../models/territorio.model';
import { Niveles } from '../models/niveles.model';
import { Modalidades } from '../models/modalidades.model';
import { CodigoSufijoDocente } from '../models/codigo-sufijo-docente.model';


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

  getSexos(): Observable<Sexo[]> {
    return this.http.get<Sexo[]>(`${this.baseBackendUrl}/sexos`).pipe(
      catchError(this.handleError)
    );
  }

  getUbchs(): Observable<Ubch[]> {
    return this.http.get<Ubch[]>(`${this.baseBackendUrl}/ubchs`).pipe(
      catchError(this.handleError)
    );
  }

  getComunas(): Observable<Comunas[]> {
    return this.http.get<Comunas[]>(`${this.baseBackendUrl}/comunas`).pipe(
      catchError(this.handleError)
    );
  }

  getConsejosComunales(): Observable<ConsejoComunales[]> {
    return this.http.get<ConsejoComunales[]>(`${this.baseBackendUrl}/consejos_comunales`).pipe(
      catchError(this.handleError)
    );
  }

  getTiposPersonal(): Observable<TiposPersonal[]> {
    return this.http.get<TiposPersonal[]>(`${this.baseBackendUrl}/tipos_personal`).pipe(
      catchError(this.handleError)
    );
  }

  getTurnos(): Observable<Turnos[]> {
    return this.http.get<Turnos[]>(`${this.baseBackendUrl}/turnos`).pipe(
      catchError(this.handleError)
    );
  }

  getSituacionesLaborales(): Observable<SituacionLaboral[]> {
    return this.http.get<SituacionLaboral[]>(`${this.baseBackendUrl}/situaciones_laborales`).pipe(
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

  getCargosDocentes(): Observable<CargoDocentes[]> {
    return this.http.get<CargoDocentes[]>(`${this.baseBackendUrl}/cargos_docentes`).pipe(
      catchError(this.handleError)
    );
  }

  getCargosAdministrativos(): Observable<CargoAdministrativos[]> {
    return this.http.get<CargoAdministrativos[]>(`${this.baseBackendUrl}/cargos_administrativos`).pipe(
      catchError(this.handleError)
    );
  }

  getCargosObreros(): Observable<CargosObreros[]> {
    return this.http.get<CargosObreros[]>(`${this.baseBackendUrl}/cargos_obreros`).pipe(
      catchError(this.handleError)
    );
  }

  getGradosObreros(): Observable<GradosObreros[]> {
    return this.http.get<GradosObreros[]>(`${this.baseBackendUrl}/grados_obreros`).pipe(
      catchError(this.handleError)
    );
  }

  getDenominacionesPlantel(): Observable<Denominaciones[]> {
    return this.http.get<Denominaciones[]>(`${this.baseBackendUrl}/denominaciones_plantel`).pipe(
      catchError(this.handleError)
    );
  }

  getDependenciasPlantel(): Observable<Dependencias[]> {
    return this.http.get<Dependencias[]>(`${this.baseBackendUrl}/dependencias_plantel`).pipe(
      catchError(this.handleError)
    );
  }

  getUbicacionesPlantel(): Observable<Territorio[]> {
    return this.http.get<Territorio[]>(`${this.baseBackendUrl}/ubicaciones_plantel`).pipe(
      catchError(this.handleError)
    );
  }

  getNivelesPlantel(): Observable<Niveles[]> {
    return this.http.get<Niveles[]>(`${this.baseBackendUrl}/niveles_plantel`).pipe(
      catchError(this.handleError)
    );
  }

  getModalidadesPlantel(): Observable<Modalidades[]> {
    return this.http.get<Modalidades[]>(`${this.baseBackendUrl}/modalidades_plantel`).pipe(
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

  getParroquiasByMunicipio(municipioId: number): Observable<Municipio[]> {
    return this.http.get<Municipio[]>(`${this.baseBackendUrl}/parroquias/by-municipio/${municipioId}`).pipe(
      catchError(this.handleError)
    );
  }

  getTiposDocenteEspecificos(): Observable<DocentesEspecificos[]> {
    return this.http.get<DocentesEspecificos[]>(`${this.baseBackendUrl}/tipos_docente_especificos`).pipe(
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

  getCodigosSufijoDocente(): Observable<CodigoSufijoDocente[]> {
    return this.http.get<CodigoSufijoDocente[]>(`${this.baseBackendUrl}/codigoSufijoDocente`).pipe(
      catchError(this.handleError)
    );
  }

  getCodigosByCargoDocente(idCargo: number): Observable<CodigoSufijoDocente[]> {
    return this.http.get<CodigoSufijoDocente[]>(`${this.baseBackendUrl}/codigoSufijoDocente/cargo/${idCargo}`).pipe(
      catchError(this.handleError)
    );
  }
}

