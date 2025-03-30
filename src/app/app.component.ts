//app.component.ts:
//----------------
import { Component, OnInit, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router       } from '@angular/router';
import { Routes       } from '@angular/router';
import { AuthService } from './services/auth.service';
import { MenuStateService } from './services/menu-state.service';
import { StorageService } from './services/storage.service';
import { NavigationService } from './services/navigation.service';
import { MenuTree } from './components/menu/menu-tree';
import { MenuComponent } from './components/menu/menu.component';
import { MenuItem } from './components/menu/menu-tree'; 
import { HomeComponent  } from './components/home.component';
import { LoginComponent } from './components/login.component'; 
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  //standalone: true,
  imports: [CommonModule, RouterModule, MenuComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'] 
})
export class AppComponent implements OnInit {
  public cDatabaseUrl: string = '';
  title = "BRISK";
  loggedInUser: string = ''; 
  isMenuVisible: boolean = false;
  showUserMenu: boolean = false;
  activeSubmenu: MenuItem | null = null;
  isLargeScreen = false;

  constructor(
      public authService: AuthService,
      public storageService: StorageService, 
      public loadingService: LoadingService,
      private menuStateService: MenuStateService,
      private navigationService: NavigationService,
      private menuTree: MenuTree,
      private router: Router, 
      @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.menuStateService.isMenuVisible$.subscribe((visible) => {
      this.isMenuVisible = visible;
    });
  }

  async ngOnInit() {


    //this.loadingService.show();
    //setTimeout(() => this.loadingService.hide(), 5000);


    try {
      await this.storageService.loadConfig();
      this.cDatabaseUrl = this.storageService.cDatabaseUrl;

      await this.loadDynamicRoutes();
  
      if (!this.authService.isLoggedIn()) {
        this.navigationService.navigateTo('/login');
      } else {
        const redirectUrl = localStorage.getItem('redirectUrl') || '/home';
        this.navigationService.navigateTo(redirectUrl);
      }
    } catch (error) {
      console.error('Eroare la inițializare:', error);
    }

    ////////////////////////
    this.checkScreenWidth();
    ////////////////////////

  }

async loadDynamicRoutes(): Promise<void> {
  return new Promise((resolve, reject) => {
      this.menuTree.getMenuFromApi().subscribe(menuItems => {
          const dynamicRoutes = this.menuTree.createRoutes(menuItems);
          const baseRoutes: Routes= [
            { path: '', redirectTo: '/home', pathMatch: 'full' }, // Redirecționează către o rută implicită
            { path: 'home', component: HomeComponent },
            { path: 'login', component: LoginComponent },
            { path: '**', redirectTo: '/login' } // Redirect pentru orice altă rută
        ];
          this.router.resetConfig([...dynamicRoutes, ...baseRoutes]);
          resolve(); // Rutele au fost încărcate
      }, error => {
          console.error('Failed to load dynamic routes:', error);
          reject(error); // Eroare la încărcarea rutelor
      });
  });
}

  @HostListener('window:beforeunload')
  clearLocalStorage() {
    localStorage.removeItem('cDatabaseUrl');
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenWidth();
  }

  checkScreenWidth() {
    if (isPlatformBrowser(this.platformId)) {
      this.isLargeScreen = window.innerWidth >= 992;
      this.isMenuVisible = this.isLargeScreen && this.authService.isLoggedIn();
    }
  }

  toggleMenu() {
    if (!this.isLargeScreen && isPlatformBrowser(this.platformId)) {
      this.menuStateService.toggleMenu();
    }
  }

  toggleSubmenu(item: MenuItem) {
    if (this.activeSubmenu === item) {
      this.activeSubmenu = null; 
    } else {
      this.activeSubmenu = item; 
    }
  }
  toggleUserMenu() {
    if (this.authService.isLoggedIn()) {
        this.showUserMenu = !this.showUserMenu;
    } else {
      this.navigationService.navigateTo('/login'); 
    }
  }
  navigateTo(route: string) {
    localStorage.setItem('redirectUrl', route);
    this.navigationService.navigateTo(route);
  }
  navigateToProfile() {
    this.navigationService.navigateTo('/logged_profile');
    this.showUserMenu = false;
  }
  navigateToSettings() {
    this.navigationService.navigateTo('/settings'); 
    this.showUserMenu = false;
  }
  navigateToHelp() {
      this.navigationService.navigateTo('/help'); 
      this.showUserMenu = false;
  }
  logout() {
      this.authService.logout();
      this.showUserMenu = false;
  }
}