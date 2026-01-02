import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { ROLES } from '../../core/constants/constantes';
import { Auth } from '../../core/services/auth';

// Interfaz que define la estructura de una tarjeta de tabla, incluyendo los roles requeridos.
interface TableCard {
  title: string;
  description: string;
  icon: string;
  route: string; // USA LOS NOMBRES EXACTOS DE SU LISTA
  className: string;
  requiredRoles: ROLES[]; // Roles que tienen permiso para ver esta tarjeta
}

@Component({
  selector: 'app-database',
  imports: [ CommonModule ],
  templateUrl: './database.html',
  styleUrl: './database.css',
})
export class Database implements OnInit {

  // ROL ACTUAL DEL USUARIO: Modifique esta línea para simular el rol de prueba.
  private currentUserRole!: ROLES;

  // PROPIEDAD QUE CONTENDRÁ SOLO LAS TARJETAS QUE EL USUARIO PUEDE VER (el resultado del filtro).
  public visibleTables: TableCard[] = [];

  // Array que contiene la definición completa de las 25 tablas con sus rutas EXACTAS.
  public specificTables: TableCard[] = [
    // --- GESTIÓN DE SEGURIDAD ---
    {
      title: 'Usuarios', description: 'Gestión de credenciales y perfiles de acceso.', icon: 'people', route: 'users', className: 'card-primary',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_SQUAD]
    },
    {
      title: 'Roles del Sistema', description: 'Definición y permisos de los roles del sistema.', icon: 'person-fill-lock', route: 'roles', className: 'card-primary',
      requiredRoles: [ROLES.SUPER_ADMIN]
    },
    {
      title: 'Catálogo de Sexos', description: 'Definición de opciones de género/sexo.', icon: 'gender-ambiguous', route: 'sexos', className: 'card-primary',
      requiredRoles: [ROLES.SUPER_ADMIN]
    },

    // --- GESTIÓN DE PERSONAL ---
    {
      title: 'Empleados', description: 'Registro y datos personales de todo el personal.', icon: 'person-workspace', route: 'empleados', className: 'card-danger',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_SQUAD]
    },
    {
      title: 'Tipos de Personal', description: 'Catálogo de tipos de personal (docente, administrativo, obrero).', icon: 'person-badge', route: 'tipos_personal', className: 'card-danger',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },
    {
      title: 'Situaciones Laborales', description: 'Estatus laborales (activo, reposo, jubilado, etc.).', icon: 'journal-check', route: 'situaciones_laborales', className: 'card-danger',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },

    // --- CARGOS Y NOMENCLATURA ---
    {
      title: 'Cargos Docentes', description: 'Nomenclatura de cargos del personal docente.', icon: 'book', route: 'cargos_docentes', className: 'card-success',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },
    {
      title: 'Cargos Administrativos', description: 'Nomenclatura de cargos de soporte y gestión.', icon: 'briefcase', route: 'cargos_administrativos', className: 'card-success',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },
    {
      title: 'Grados Obreros', description: 'Clasificación de grados dentro de los cargos obreros.', icon: 'list-ol', route: 'grados_obreros', className: 'card-success',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },
    {
      title: 'Cargos Obreros', description: 'Nomenclatura de cargos para el personal obrero.', icon: 'tools', route: 'cargos_obreros', className: 'card-success',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },
    {
      title: 'Tipos Docentes Específicos', description: 'Catálogo de especialidades del personal docente.', icon: 'person-video2', route: 'tipos_docente_especificos', className: 'card-success',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },

    // --- GESTIÓN GEOGRÁFICA Y JURISDICCIÓN ---
    {
      title: 'Estados', description: 'Lista de estados geográficos del país.', icon: 'geo-alt', route: 'estados', className: 'card-secondary',
      requiredRoles: [ROLES.SUPER_ADMIN]
    },
    {
      title: 'Municipios', description: 'Lista de municipios por estado.', icon: 'pin-map', route: 'municipios', className: 'card-secondary',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },
    {
      title: 'Parroquias', description: 'Lista de parroquias por municipio.', icon: 'house-door', route: 'parroquias', className: 'card-secondary',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE, ROLES.ADMIN_MUNICIPAL]
    },
    {
      title: 'Circuitos Educativos', description: 'Organización de circuitos educativos.', icon: 'share', route: 'circuitos', className: 'card-secondary',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_MUNICIPAL]
    },

    // --- DATOS DE PLANTEL ---
    {
      title: 'Planteles', description: 'Registro central de unidades educativas.', icon: 'buildings', route: 'planteles', className: 'card-warning',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_SQUAD]
    },
    {
      title: 'Denominaciones Plantel', description: 'Tipos de denominación (Nacional, Estadal, etc.).', icon: 'tag', route: 'denominaciones_plantel', className: 'card-warning',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },
    {
      title: 'Dependencias Plantel', description: 'Dependencia administrativa de los planteles.', icon: 'bezier2', route: 'dependencias_plantel', className: 'card-warning',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },
    {
      title: 'Modalidades Plantel', description: 'Modalidades de enseñanza disponibles.', icon: 'layout-text-sidebar-reverse', route: 'modalidades_plantel', className: 'card-warning',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },
    {
      title: 'Niveles Plantel', description: 'Niveles educativos impartidos (Inicial, Media, etc.).', icon: 'layers', route: 'niveles_plantel', className: 'card-warning',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },
    {
      title: 'Ubicaciones Plantel', description: 'Coordenadas y tipo de ubicación del plantel.', icon: 'map', route: 'ubicaciones_plantel', className: 'card-warning',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },
    {
      title: 'Turnos Escolares', description: 'Tipos de turnos de trabajo.', icon: 'clock-history', route: 'turnos', className: 'card-warning',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_STATE]
    },

    // --- ORGANIZACIÓN SOCIAL ---
    {
      title: 'Comunas', description: 'Registro de Comunas del territorio.', icon: 'bank2', route: 'comunas', className: 'card-info',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_SQUAD]
    },
    {
      title: 'Consejos Comunales', description: 'Registro de Consejos Comunales asociados.', icon: 'house-heart', route: 'consejos_comunales', className: 'card-info',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_SQUAD]
    },
    {
      title: 'UBCHs', description: 'Unidades de Batalla Hugo Chávez.', icon: 'flag', route: 'ubchs', className: 'card-info',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_SQUAD]
    },
  ];

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private authService: Auth) { }

  ngOnInit(): void {
    // 1. Obtener el rol real del usuario logueado
    this.getCurrentUserRole();
    // 2. Filtrar las tablas
    this.filterTablesByRole();
  }

  /**
   * Obtiene el código de rol del usuario autenticado desde el AuthService.
   * Si no hay datos de usuario o no está autenticado, usa ROLES.USER_STANDARD como fallback.
   */
  private getCurrentUserRole(): void {
    const userData = this.authService.getUserData();
    if (userData && userData.cod_rol) {
      // Asume que userData.cod_rol coincide con uno de los valores de la constante ROLES
      this.currentUserRole = userData.cod_rol as ROLES;

    } else {
      console.warn(`No se pudo obtener el rol del usuario. Usando fallback: ${this.currentUserRole}`);
    }
  }

  /**
   * Filtra el array 'specificTables' basándose en el rol del usuario actual.
   * El resultado se guarda en 'visibleTables'.
   */
  private filterTablesByRole(): void {
    this.visibleTables = this.specificTables.filter(card =>
      card.requiredRoles.includes(this.currentUserRole)
    );
  }

  /**
   * Navega a la ruta hija específica de la tabla seleccionada.
   */
  selectCard(card: TableCard): void {
    this.router.navigate(['/panel/control/gestor/database', card.route]);
    //console.log(`Navegando a tabla: ${card.route}`);
  }

  /**
   * Navega de vuelta a la vista principal del GestorPlantel (un nivel arriba).
   */
  goBack(): void {
    this.router.navigate(['/panel/control/gestor']);
  }
}
