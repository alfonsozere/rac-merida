import { Empleado } from "./empleado.model";

/**
 * @interface EmpleadoEliminado
 * @description Interfaz para la información extendida de un empleado.
 */
export interface EmpleadoEliminado extends Empleado {
  fecha_eliminacion: string;
  usuario_eliminador?: string | null;
  motivo?: string | null;
}