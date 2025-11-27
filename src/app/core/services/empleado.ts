import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Solo HttpClient, no HttpHeaders
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicioEmpleado {
  private apiUrl = environment.apiUrl; // URL base de tu backend

  constructor(private http: HttpClient) { } // Ya no inyecta AuthService

  obtenerEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/empleados`);
  }

  obtenerEmpleadoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/empleados/${id}`);
  }

  crearEmpleado(empleado: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/empleados`, empleado);
  }

  actualizarEmpleado(id: number, empleado: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/empleados/${id}`, empleado);
  }

  eliminarEmpleado(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/empleados/${id}`);
  }
}

