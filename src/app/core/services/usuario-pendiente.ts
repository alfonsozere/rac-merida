import { Injectable } from '@angular/core';
import { ROLES } from '../constants/constantes';
import { Usuario } from '../models/usuario.model';


@Injectable({
  providedIn: 'root'
})
export class UserApprovalService {

  constructor() { }

  /**
   * Prepara el objeto Partial<Usuario> para la aprobación de un usuario pendiente.
   * Asigna el rol y la ubicación sugeridos como los campos "activos"
   * y limpia todos los campos de sugerencia, estableciéndolos a null.
   * @param user El objeto Usuario pendiente a aprobar.
   * @returns Un objeto Partial<Usuario> con los campos _asignado actualizados
   * y todos los campos _sugerido establecidos a null, listo para enviar a la API.
   */
  prepareUserForApproval(user: Usuario): Partial<Usuario> {
    return {
      id_usuario: user.id_usuario,
      cod_rol: user.cod_rol_sugerido || ROLES.STANDARD, // Asigna el rol sugerido como rol activo

      // Asigna los campos de ubicación sugeridos como los campos activos
      id_estado_asignado: user.id_estado_sugerido,
      id_municipio_asignado: user.id_municipio_sugerido,
      id_circuito_asignado: user.id_circuito_sugerido,
      codigo_plantel_asignado: user.codigo_plantel_sugerido,
      
      // Limpia todos los campos de sugerencia después de la aprobación
      cod_rol_sugerido: null,
      id_estado_sugerido: null,
      id_municipio_sugerido: null,
      id_circuito_sugerido: null,
      codigo_plantel_sugerido: null,
      // Añade aquí cualquier otro campo '_sugerido' que necesites limpiar
      // Por ejemplo:
      // id_ubch_sugerida: null,
      // id_comuna_sugerida: null,
      // ...
    };
  }
}

