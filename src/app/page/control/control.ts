import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ROLES } from '../../core/constants/constantes';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-control',
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './control.html',
  styleUrl: './control.css'
})
export class Control implements OnInit, OnDestroy {
  userRole: number | null = null;
  hasActiveChildRoute: boolean = false;
  private routerEventsSubscription: Subscription | undefined;

  public ROLES = ROLES;

  private allControlCards = [
    {
      title: 'Autorización de Usuarios',
      description: '',
      icon: 'person-check-fill',
      route: '',
      requiredRole: 0,
      className: 'card-authorization'
    },
    {
      title: 'Funcionalidades Estadal',
      description: 'Gestión de datos a nivel de estado.',
      icon: 'map-fill',
      route: 'gestor-estadal',
      requiredRole: [ROLES.ADMIN_STATE],
      className: 'card-state'
    },
    {
      title: 'Funcionalidades Municipal',
      description: 'Gestión de datos a nivel de municipio.',
      icon: 'buildings-fill',
      route: 'gestor-municipal',
      requiredRole: ROLES.ADMIN_MUNICIPAL,
      className: 'card-municipal'
    },
    {
      title: 'Funcionalidades Circuital',
      description: 'Gestión de datos a nivel de circuito.',
      icon: 'bezier',
      route: 'gestor-circuital',
      requiredRole: ROLES.ADMIN_CIRCUITAL,
      className: 'card-circuital'
    },
    {
      title: 'Funcionalidades del Plantel',
      description: 'Gestión de datos a nivel de plantel educativo.',
      icon: 'mortarboard-fill',
      route: 'gestor-director',
      requiredRole: [ROLES.ADMIN_SQUAD],
      className: 'card-plantel'
    },
    {
      title: 'Funcionalidades del Secretario',
      description: 'Gestión de nómina asignada al secretario institucional.',
      icon: 'person-vcard-fill',
      route: 'gestor-administrativo',
      requiredRole: [ROLES.STANDARD],
      className: 'card-plantel'
    },
    {
      title: 'Control DB',
      description: 'Herramientas de administración y mantenimiento de la base de datos.',
      icon: 'database-fill-gear',
      route: 'db',
      requiredRole: ROLES.SUPER_ADMIN,
      className: 'card-db'
    }
  ];

  public controlCards: {
    title: string;
    description: string;
    icon: string;
    route: string;
    requiredRole: number | ROLES[];
    className: string;
  }[] = [];

  constructor(private router: Router, private authService: Auth, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (userData && userData.cod_rol !== undefined) {
      this.userRole = userData.cod_rol;

      // 🔒 Filtrar tarjetas según el rol
      if (this.userRole === 0) {
        this.controlCards = this.allControlCards.filter(card => card.className === 'card-plantel');
      } else {
        this.controlCards = this.allControlCards;
      }

      this.checkChildRouteActive();
      this.routerEventsSubscription = this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.checkChildRouteActive();
      });
    } else {
      console.warn('ControlComponent: No se pudo obtener el rol del usuario. Redirigiendo a login.');
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy(): void {
    if (this.routerEventsSubscription) {
      this.routerEventsSubscription.unsubscribe();
    }
  }

  private checkChildRouteActive(): void {
    this.hasActiveChildRoute = this.activatedRoute.firstChild !== null;
  }

  getDynamicCardDetails(card: any): any {
    if (card.className !== 'card-authorization' && card.className !== 'card-plantel') {
      return card;
    }

    if (this.userRole === null) {
      return card;
    }

    // 🔹 Tarjeta dinámica de autorización
    if (card.className === 'card-authorization') {
      let dynamicTitle = 'Autorización de Usuarios';
      let dynamicDescription = 'Gestionar solicitudes de aprobación de usuarios pendientes.';
      let dynamicRoute = '';
      let dynamicClassName = 'card-authorization';

      switch (this.userRole) {
        case ROLES.SUPER_ADMIN:
          dynamicTitle = 'Autorización de Usuarios (SuperAdmin)';
          dynamicDescription = 'Aprobar solicitudes de Administradores Estadales.';
          //dynamicRoute = 'autorizacion-superadmin';
          dynamicRoute = 'autorizacion';
          dynamicClassName += ' card-superadmin-auth';
          break;
        case ROLES.ADMIN_STATE:
          dynamicTitle = 'Autorización de Usuarios (Estadal)';
          dynamicDescription = 'Aprobar solicitudes de Administradores Municipales.';
          //dynamicRoute = 'autorizacion-estadal';
          dynamicRoute = 'autorizacion';
          dynamicClassName += ' card-admin-state-auth';
          break;
        case ROLES.ADMIN_MUNICIPAL:
          dynamicTitle = 'Autorización de Usuarios (Municipal)';
          dynamicDescription = 'Aprobar solicitudes de Administradores Circuitales.';
          //dynamicRoute = 'autorizacion-municipal';
          dynamicRoute = 'autorizacion';
          dynamicClassName += ' card-admin-municipal-auth';
          break;
        case ROLES.ADMIN_CIRCUITAL:
          dynamicTitle = 'Autorización de Usuarios (Circuital)';
          dynamicDescription = 'Aprobar solicitudes de Administradores de Cuadrilla (Squad).';
          //dynamicRoute = 'autorizacion-circuital';
          dynamicRoute = 'autorizacion';
          dynamicClassName += ' card-admin-circuital-auth';
          break;
        case ROLES.ADMIN_SQUAD:
          dynamicTitle = 'Autorización de Usuarios (Director)';
          dynamicDescription = 'Autorización de usuarios nuevos en su respectivo plantel';
          //dynamicRoute = 'autorizacion-plantel';
          dynamicRoute = 'autorizacion';
          dynamicClassName += ' card-adminsquad-auth';
          break;
        case ROLES.STANDARD:
          dynamicTitle = 'Autorización de Usuarios (Secretario)';
          dynamicDescription = 'Autorización de usuarios nuevos en su respectivo plantel';
          //dynamicRoute = 'autorizacion-plantel';
          dynamicRoute = 'autorizacion';
          dynamicClassName += ' card-adminsquad-auth';
          break;
        default:
          dynamicTitle = card.title;
          dynamicDescription = card.description;
          dynamicRoute = '';
          break;
      }

      return {
        ...card,
        title: dynamicTitle,
        description: dynamicDescription,
        route: dynamicRoute,
        className: dynamicClassName,
        isAuthorizationCard: true
      };
    }

    // 🔹 Tarjeta dinámica de RAC Plantel
    if (card.className === 'card-plantel') {
      
      const dynamicRoute = this.userRole === ROLES.STANDARD ? 'gestor-administrativo' : 'gestor-director';
      return {
        ...card,
        route: dynamicRoute
      };
    }
    return card;
  }

  isCardEnabled(card: any): boolean {
    if (this.userRole === null) {
      return false;
    }

    if (card.className === 'card-authorization') {
      return this.userRole === ROLES.SUPER_ADMIN ||
        this.userRole === ROLES.ADMIN_STATE ||
        this.userRole === ROLES.ADMIN_MUNICIPAL ||
        this.userRole === ROLES.ADMIN_CIRCUITAL ||
        this.userRole === ROLES.ADMIN_SQUAD ||
        this.userRole === ROLES.STANDARD;
    }

    if (this.userRole === ROLES.SUPER_ADMIN) {
      return true;
    }

    if (Array.isArray(card.requiredRole)) {
      return card.requiredRole.includes(this.userRole);
    }

    return this.userRole === card.requiredRole;
  }

  selectControlCard(card: any): void {
    const dynamicCard = this.getDynamicCardDetails(card);

    const isAuthorizationCard = card.className === 'card-authorization';
    const isOutsideControl = dynamicCard.route === 'gestor-administrativo';

    if (isAuthorizationCard) {
      if (
        this.userRole === ROLES.SUPER_ADMIN ||
        this.userRole === ROLES.ADMIN_STATE ||
        this.userRole === ROLES.ADMIN_MUNICIPAL ||
        this.userRole === ROLES.ADMIN_CIRCUITAL ||
        this.userRole === ROLES.ADMIN_SQUAD ||
        this.userRole === ROLES.STANDARD
      ) {
        if (dynamicCard.route) {
          this.router.navigate(['/panel/control', dynamicCard.route]);
        }
      }
    } else {
      if (this.isCardEnabled(card)) {
        this.router.navigate(['/panel/control', dynamicCard.route]);
      }
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/panel']);
  }

  goToControlHome(): void {
    this.router.navigate(['./'], { relativeTo: this.activatedRoute });
  }
}
