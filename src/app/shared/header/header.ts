import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../core/auth';
import { ROLES } from '../../../core/constants/constantes';
import { Subscription } from 'rxjs';

interface UserData {
  cod_rol: number;
  nombre: string;
  apellido: string;
  [key: string]: any;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit, OnDestroy {
  logoUrl: string = 'assets/images/logo-flag.png';
  currentUser: UserData | null = null;
  private userSubscription: Subscription | null = null;

  constructor(private authService: Auth, private router: Router) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  private getCurrentUserRole(): number | null {
    return this.currentUser ? this.currentUser.cod_rol : null;
  }

  getRoleNameById(roleId: number | null | undefined): string {
    const effectiveRoleId = roleId ?? 0;
    switch (effectiveRoleId) {
      case ROLES.SUPER_ADMIN: return 'Super Administrador';
      case ROLES.ADMIN_STATE: return 'Administrador de Estado';
      case ROLES.ADMIN_MUNICIPAL: return 'Administrador Municipal';
      case ROLES.ADMIN_CIRCUITAL: return 'Administrador Circuital';
      case ROLES.ADMIN_SQUAD: return 'Director de Plantel';
      case ROLES.STANDARD: return 'Secretario del plantel';
      case ROLES.PENDING: return 'Pendiente de Aprobación';
      case 0: return 'Desconocido';
      default: return 'Rol Inválido';
    }
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  canAccessControl(): boolean {
    const role = this.getCurrentUserRole();
    if (role === null) return false;
    const allowedRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN_STATE,
      ROLES.ADMIN_MUNICIPAL,
      ROLES.ADMIN_SQUAD,
      ROLES.ADMIN_CIRCUITAL,
    ];
    return allowedRoles.includes(role);
  }

  canAccessDbMenu(): boolean {
    const role = this.getCurrentUserRole();
    if (role === null) return false;
    return [ROLES.SUPER_ADMIN].includes(role);
  }

  logout(): void {
    this.authService.logout();
  }

  goToRegister(): void {
    this.router.navigate(['/registro']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
