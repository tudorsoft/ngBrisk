// auth.guard.ts:
//--------------
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NavigationService } from './navigation.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private navigationService: NavigationService,
    public authService: AuthService, 
    private router: Router
  ) {}
  canActivate() {
    if (this.authService.isAuthDisabled || this.authService.isLoggedIn()) {
      return true;
    } else {
      console.log('redirectUrl (authGuard) ', this.router.url);
      localStorage.setItem('redirectUrl', this.router.url);
      this.navigationService.navigateTo('/login'); 
      return false;
    }
  }
}