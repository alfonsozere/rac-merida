import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
    // Ahora el GET recibe un objeto genérico o una interfaz de respuesta
    return this.http.get<any>(`${this.baseBackendUrl}/sexos`).pipe(
      map(response => {
        // Extraemos el array 'sexos' del objeto de respuesta
        // Si por alguna razón no viene, devolvemos un array vacío para evitar el error NG02200
        return response && response.sexos ? response.sexos : [];
      }),
      catchError(this.handleError)
    );
  }

  getUbchs(): Observable<Ubch[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/ubchs`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'ubchs' definida en el backend
        return response && response.ubchs ? response.ubchs : [];
      }),
      catchError(this.handleError)
    );
  }

  getComunas(): Observable<Comunas[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/comunas`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'comunas' definida en el backend
        return response && response.comunas ? response.comunas : [];
      }),
      catchError(this.handleError)
    );
  }

  getConsejosComunales(): Observable<ConsejoComunales[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/consejos_comunales`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'consejos_comunales' definida en el backend
        return response && response.consejos_comunales ? response.consejos_comunales : [];
      }),
      catchError(this.handleError)
    );
  }

  getTiposPersonal(): Observable<TiposPersonal[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/tipos_personal`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'tipos_personal' definida en el backend
        return response && response.tipos_personal ? response.tipos_personal : [];
      }),
      catchError(this.handleError)
    );
  }

  getCargosDocentes(): Observable<CargoDocentes[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/cargos_docentes`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'cargos_docentes' definida en el backend
        return response && response.cargos_docentes ? response.cargos_docentes : [];
      }),
      catchError(this.handleError)
    );
  }

  getTiposDocenteEspecificos(): Observable<DocentesEspecificos[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/tipos_docente_especificos`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'tipos_docente_especificos' definida en el backend
        return response && response.tipos_docente_especificos ? response.tipos_docente_especificos : [];
      }),
      catchError(this.handleError)
    );
  }

  getCodigosSufijoDocente(): Observable<CodigoSufijoDocente[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/codigoSufijoDocente`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'codigos_sufijo' definida en el backend
        return response && response.codigoSufijoDocente ? response.codigoSufijoDocente : [];
      }),
      catchError(this.handleError)
    );
  }

  getCodigosByCargoDocente(idCargo: number): Observable<CodigoSufijoDocente[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/codigoSufijoDocente/cargo/${idCargo}`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'codigos_sufijo' definida en el backend
        return response && response.codigos_sufijo ? response.codigos_sufijo : [];
      }),
      catchError(this.handleError)
    );
  }

  getCargosAdministrativos(): Observable<CargoAdministrativos[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/cargos_administrativos`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'cargos_administrativos' definida en el backend
        return response && response.cargos_administrativos ? response.cargos_administrativos : [];
      }),
      catchError(this.handleError)
    );
  }

  getGradosObreros(): Observable<GradosObreros[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/grados_obreros`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'grados_obreros' definida en el backend
        return response && response.grados_obreros ? response.grados_obreros : [];
      }),
      catchError(this.handleError)
    );
  }

  getCargosObreros(): Observable<CargosObreros[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/cargos_obreros`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'cargos_obreros' definida en el backend
        return response && response.cargos_obreros ? response.cargos_obreros : [];
      }),
      catchError(this.handleError)
    );
  }

  getTurnos(): Observable<Turnos[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/turnos`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'turnos' definida en el backend
        return response && response.turnos ? response.turnos : [];
      }),
      catchError(this.handleError)
    );
  }

  getSituacionesLaborales(): Observable<SituacionLaboral[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/situaciones_laborales`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'situaciones_laborales' definida en el backend
        return response && response.situaciones_laborales ? response.situaciones_laborales : [];
      }),
      catchError(this.handleError)
    );
  }

  getEstados(): Observable<Estado[]> {
    return this.http.get<any>(`${this.baseBackendUrl}/estados`).pipe(
      map(response => {
        // Extraemos específicamente la propiedad 'estados' definida en el backend
        return response && response.estados ? response.estados : [];
      }),
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
}

