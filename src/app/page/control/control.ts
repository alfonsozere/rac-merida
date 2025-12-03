import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ROLES } from '../../core/constants/constantes';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './control.html',
  styleUrls: ['./control.css']
})
export class Control implements OnInit, OnDestroy {
  userRole: number | null = null;
  hasActiveChildRoute: boolean = false;
  private routerEventsSubscription: Subscription | undefined;

  public ROLES = ROLES;

  // 🔹 Ahora solo una tarjeta para el Gestor único
  private allControlCards = [
    {
      title: 'Gestor de Funcionalidades',
      description: 'Acceso a usuarios, empleados, base de datos y más según tu rol.',
      icon: 'gear-fill',
      route: 'gestor',
      requiredRole: [
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN_STATE,
        ROLES.ADMIN_MUNICIPAL,
        ROLES.ADMIN_CIRCUITAL,
        ROLES.ADMIN_SQUAD,
        ROLES.STANDARD
      ],
      className: 'card-gestor'
    },
    {
      title: 'Autorización de Usuarios',
      description: 'Gestionar solicitudes de aprobación de usuarios pendientes.',
      icon: 'person-check-fill',
      route: 'autorizacion',
      requiredRole: [
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN_STATE,
        ROLES.ADMIN_MUNICIPAL,
        ROLES.ADMIN_CIRCUITAL,
        ROLES.ADMIN_SQUAD
      ],
      className: 'card-authorization'
    }
  ];

  public controlCards: any[] = [];

  constructor(private router: Router, private authService: Auth, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (userData && userData.cod_rol !== undefined) {
      this.userRole = userData.cod_rol;

      // 🔒 Filtrar tarjetas según el rol
      this.controlCards = this.allControlCards.filter(card =>
        Array.isArray(card.requiredRole)
          ? card.requiredRole.includes(this.userRole!)
          : this.userRole === card.requiredRole
      );

      this.checkChildRouteActive();
      this.routerEventsSubscription = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
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

  isCardEnabled(card: any): boolean {
    if (this.userRole === null) return false;
    if (Array.isArray(card.requiredRole)) {
      return card.requiredRole.includes(this.userRole);
    }
    return this.userRole === card.requiredRole;
  }

  selectControlCard(card: any): void {
    if (this.isCardEnabled(card)) {
      this.router.navigate(['/panel/control', card.route]);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/panel']);
  }

  goToControlHome(): void {
    this.router.navigate(['./'], { relativeTo: this.activatedRoute });
  }
}
