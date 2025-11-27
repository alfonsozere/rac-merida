import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd, RouterOutlet } from '@angular/router'; // Añadido NavigationEnd y RouterOutlet
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-gestor-web',
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './gestor-web.html',
  styleUrl: './gestor-web.css',
})
export class GestorWeb implements OnInit, OnDestroy {
  
  hasActiveChildRoute: boolean = false;
  private routerEventsSubscription: Subscription | undefined;

  specificCards = [
    {
      title: 'Control de Usuarios',
      description: 'Administración de usuarios asignados a este estado.',
      icon: 'people-fill',
      route: 'usuarios'
    },
    {
      title: 'Control de Nómina',
      description: 'Gestión de la nómina asignada a este estado.',
      icon: 'person-workspace',
      route: 'empleados'
    },
    {
      title: 'Control de Base de datos',
      description: 'Gestión de la base de datos asignada a este plantel.',
      icon: 'database-gear',
      route: 'database'
    }
  ];

  constructor(private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.checkChildRouteActive();
    this.routerEventsSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkChildRouteActive();
    });
  }

  ngOnDestroy(): void {
    if (this.routerEventsSubscription) {
      this.routerEventsSubscription.unsubscribe();
    }
  }
  
  private checkChildRouteActive(): void {
    this.hasActiveChildRoute = this.activatedRoute.firstChild !== null;
  }

  goBackToControl(): void {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  navigateToCard(card: any): void {
    this.router.navigate([card.route], { relativeTo: this.activatedRoute });
  }
  
  goToEstadalHome(): void {
    this.router.navigate(['./'], { relativeTo: this.activatedRoute });
  }
}
