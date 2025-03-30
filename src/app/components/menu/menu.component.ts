//menu.component.ts: 
//-----------------
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AuthGuard } from '../../services/auth.guard';
import { Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { StorageService } from '../../services/storage.service';
import { MenuService } from '../../services/menu.service';
import { MenuStateService } from '../../services/menu-state.service';
import { NavigationService } from '../../services/navigation.service';
import { MenuTree } from './menu-tree';
import { MenuItem } from '../../services/menu.service';

@Component({
  selector: 'app-menu',
  //standalone: true, 
  imports: [CommonModule],
  providers: [AuthGuard],
  templateUrl: './menu.component.html',
  styleUrls: [ './menu.component.scss']
})

export class MenuComponent implements OnInit {
  @Input() isMenuVisible: boolean = false;
  @Input() activeSubmenu: MenuItem | null = null;
  @Output() submenuToggle = new EventEmitter<MenuItem>();

  menuTree: MenuItem[] = [];
  activeChild: MenuItem | null = null;

  constructor(
    public storageService: StorageService,
    public authService: AuthService, 
    private menuStateService: MenuStateService,
    private navigationService: NavigationService,
    private menuService: MenuService, 
    private menuTreeService: MenuTree,
    private router: Router, 
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd && window.innerWidth < 992) {
          this.menuStateService.closeMenu();
        }
      });

      this.menuStateService.isMenuVisible$.subscribe((visible) => {
        this.isMenuVisible = visible;
      });
    }

    ngOnInit() {
      this.storageService.cDatabaseUrl$
        .pipe(filter(url => url !== '')) // Așteaptă ca URL-ul să fie definit
        .subscribe((url) => {
          this.menuService.getMenu().subscribe((menuItems) => {
            if (menuItems && menuItems.length > 0) {
              this.menuTree = menuItems;
              // Dacă este necesar, actualizează și rutele dinamice:
              const routes = this.menuTreeService.createRoutes(menuItems);
            } else {
              console.warn('Nu s-au găsit elemente de meniu de la API');
            }
          });
        });
    }

  navigateTo(route: string, item: MenuItem) {
    localStorage.setItem('redirectUrl', route);
    if (this.authService.isLoggedIn()) {
      this.navigationService.navigateTo(route);
    } else {
      this.navigationService.navigateTo('/login');
    }
    if (isPlatformBrowser(this.platformId) && window.innerWidth < 992) {
      this.menuStateService.closeMenu();
    }
  }

  toggleMenu() {
    this.menuStateService.toggleMenu();
  }

  toggleSubmenu(item: MenuItem) {
    if (this.activeSubmenu === item) {
      this.activeSubmenu = null;  // Închide submeniu dacă este deja deschis
      this.activeChild = null;    // Resetează sub-submeniurile
    } else {
      this.activeSubmenu = item;  // Deschide submeniu dacă nu este deja deschis
      this.activeChild = null;    // Resetează sub-submeniurile
    }
}

toggleChildSubmenu(child: MenuItem) {
    if (this.activeChild === child) {
      this.activeChild = null;  // Închide subsubmeniu dacă este deja deschis
    } else {
      this.activeChild = child;  // Deschide subsubmeniu dacă nu este deschis
    }
}

}