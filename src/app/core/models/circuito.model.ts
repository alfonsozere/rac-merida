// src/app/models/circuito.model.ts

export interface Circuito {
  // Propiedades que estás recibiendo del API y usando en el HTML
  id_circuito: number; // Corregido: Este es el ID que llega
  nombre_circuito: string; // Corregido: Este es el nombre que llega
  codigo_circuito: string | null; // Incluido del log

  // Propiedades relacionales que ya manejabas (actualizadas para coincidir con la respuesta)
  id_municipio: number; 
  nombre_municipio: string; 
  id_estado: number; 
  nombre_estado: string;
}
