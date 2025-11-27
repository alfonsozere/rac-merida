import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ROLES } from '../../core/constants/constantes';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-panel',
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './panel.html',
  styleUrl: './panel.css'
})
export class Panel implements OnInit, OnDestroy {
userRole: number = ROLES.PENDING;
  message: string | null = null;
  messageType: 'success' | 'danger' | 'warning' | null = null;

  hasActiveChildRoute: boolean = false;
  private routerEventsSubscription: Subscription | undefined;

  cards: any[] = [
    {
      title: 'Administración',
      description: 'Gestión de usuarios y roles del sistema.',
      description2: 'Desarrollo continuo.',
      icon: 'gear-fill',
      route: '/panel/control',
      className: 'admin-card',
      roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE, ROLES.ADMIN_MUNICIPAL, ROLES.ADMIN_CIRCUITAL, ROLES.ADMIN_SQUAD]
    },
    {
      title: 'Secretarios del plantel',
      description: 'Gestión de nómina del plantel.',
      description2: 'Interacción real.',
      icon: 'people-fill',
      route: '/panel/control',
      className: 'user-card',
      roles: [ROLES.SUPER_ADMIN, ROLES.STANDARD]
    },
    {
      title: 'Informativo',
      description: 'Acceso a información general y reportes.',
      description2: 'Acceso en construcción.',
      icon: 'info-circle-fill',
      route: '', // '/panel/control/informativo',
      className: 'general-info-card',
      roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE, ROLES.ADMIN_MUNICIPAL, ROLES.ADMIN_CIRCUITAL, ROLES.ADMIN_SQUAD]
    },
  ];

  constructor(private router: Router, private authService: Auth) {}

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (userData && userData.cod_rol !== undefined && userData.cod_rol !== null) {
      this.userRole = userData.cod_rol;
    } else {
      this.router.navigate(['/login']);
      return;
    }

    this.cards.forEach(card => {
    console.log('className:', card.className);
  });

    this.checkChildRouteActive(); // Inicializar
    this.routerEventsSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkChildRouteActive(); // Re-evaluar en cada navegación
    });
  }

  ngOnDestroy(): void {
    if (this.routerEventsSubscription) {
      this.routerEventsSubscription.unsubscribe();
    }
  }

  /**
   * Verifica si hay una ruta hija activa distinta a /panel.
   * Esto permite ocultar las tarjetas cuando se navega a /panel/control, etc.
   */
  private checkChildRouteActive(): void {
    this.hasActiveChildRoute = this.router.url !== '/panel';
  }

  isCardDisabled(card: any): boolean {
    if (!card.roles || !Array.isArray(card.roles)) {
      return true;
    }
    return !card.roles.includes(this.userRole);
  }

  navigateTo(route: string, card: any): void {
    if (!this.isCardDisabled(card)) {
      this.router.navigate([route]);
    } else {
      this.mostrarMensaje('Acceso restringido. Tu rol no tiene permisos para esta área.', 'danger');
    }
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'danger' | 'warning'): void {
    this.message = mensaje;
    this.messageType = tipo;
    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 5000);
  }

  getRoleName(roleId: number): string {
    for (const [key, value] of Object.entries(ROLES)) {
      if (value === roleId) {
        return key;
      }
    }
    return 'Desconocido';
  }
}

