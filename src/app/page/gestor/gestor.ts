import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ROLES } from '../../core/constants/constantes';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-gestor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestor.html',
  styleUrls: ['./gestor.css']
})
export class GestorComponent implements OnInit {

  // Tarjetas disponibles con permisos por rol
  specificCards = [
    {
      title: 'Control de Usuarios',
      description: 'Administración de usuarios asignados.',
      icon: 'people-fill',
      route: 'panel/control/gestor/usuarios',
      roles: [
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN_STATE,
        ROLES.ADMIN_MUNICIPAL,
        ROLES.ADMIN_CIRCUITAL, 
        ROLES.ADMIN_SQUAD
      ]
    },
    {
      title: 'Control de Nómina',
      description: 'Gestión de la nómina asignada.',
      icon: 'person-workspace',
      route: 'panel/control/gestor/empleados',
      roles: [
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN_STATE,
        ROLES.ADMIN_MUNICIPAL,
        ROLES.ADMIN_CIRCUITAL, 
        ROLES.ADMIN_SQUAD,
        ROLES.STANDARD
      ]
    },
    {
      title: 'Control de Base de datos',
      description: 'Gestión de las tablas maestras del sistema.',
      icon: 'database-gear',
      route: 'panel/control/gestor/database',
      roles: [
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN_STATE,
        ROLES.ADMIN_MUNICIPAL,
        ROLES.ADMIN_CIRCUITAL, 
        ROLES.ADMIN_SQUAD
      ]
    },
    {
      title: 'Funcionarios eliminados',
      description: 'Restauración de registros eliminados.',
      icon: 'trash',
      route: 'panel/control/gestor/empleados_eliminados',
      roles: [
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN_STATE,
        ROLES.ADMIN_MUNICIPAL,
        ROLES.ADMIN_CIRCUITAL, 
        ROLES.ADMIN_SQUAD
      ]
    }
  ];

  visibleCards: any[] = [];
  currentUserRole: number | null = null;

  constructor(private router: Router, private authService: Auth) {}

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    this.currentUserRole = userData?.cod_rol || null;

    // Filtrar las tarjetas según el rol del usuario
    if (this.currentUserRole !== null) {
      this.visibleCards = this.specificCards.filter(card =>
        card.roles.includes(this.currentUserRole!)
      );
    }
  }

  // Navegación directa a páginas principales
  navigateToCard(card: any): void {
  this.router.navigateByUrl(card.route);
}
}
