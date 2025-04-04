
// auth.service.ts:
//----------------
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router            } from '@angular/router';
import { BehaviorSubject   } from 'rxjs';
import { StorageService    } from './storage.service';
import { HttpProxyService  } from './http-proxy.service';
import { NavigationService } from './navigation.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private loggedIn = new BehaviorSubject<boolean>(false);
    loginStatus = this.loggedIn.asObservable();
  
    public isAuthDisabled = false; // Schimbă aici pentru a activa/dezactiva autentificarea
    //false - cere user/pass
    //true = nu mai cere login
       
    constructor(
        private httpProxyService: HttpProxyService,
        private navigationService: NavigationService,
        public storageService: StorageService, 
        private http: HttpClient, 
        private router: Router) {
          const token = localStorage.getItem('logged_token');
          if (this.isAuthDisabled || token) {
            this.loggedIn.next(true); // Consideră că utilizatorul este autentificat
          }
        }
  
    login(username: string, password: string) {
        if (this.isAuthDisabled) {
            return;
        }
      let apiUrl = this.storageService.cDatabaseUrl.endsWith('/') ? 
                   this.storageService.cDatabaseUrl.slice(0, -1) : 
                   this.storageService.cDatabaseUrl;
      if (apiUrl !== '') {
        const loginUrl = apiUrl + '/wngLogin';
        const fullUrl = environment.useProxy
          ? 'web-proxy.php?api=' + encodeURIComponent(loginUrl)
          : loginUrl;
        const body = { username, password }; // Obiectul JSON
        
        this.http.post<any>(
          fullUrl,
          body,
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        ).subscribe(
          response => {
            if (response.success) {
              localStorage.setItem('logged_user', response.username);
              localStorage.setItem('logged_name', response.name);
              localStorage.setItem('logged_email', response.email);
              localStorage.setItem('logged_token', response.token);
              this.loggedIn.next(true);
              this.navigationService.reloadCurrentRoute();
            } else {
              alert(response.message);
            }
          },
          error => {
            console.error('Error during login:', error);
            alert('An error occurred. Please try again.');
          }
        );

        /*const fullUrl = apiUrl + '/wngLogin';
          this.http.post<any>(
            fullUrl, 
            { username, password },
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        ).subscribe(response => {
          if (response.success) {
            localStorage.setItem('logged_user' , response.username);
            localStorage.setItem('logged_name' , response.name);
            localStorage.setItem('logged_email', response.email);
            localStorage.setItem('logged_token', response.token);
            this.loggedIn.next(true);
            
            // Navighează din nou la ruta curentă
            this.navigationService.reloadCurrentRoute();

          } else {
            alert(response.message);
          }
        }, error => {
          console.error('Error during login:', error);
          alert('An error occurred. Please try again.');
        });*/
      }

    }
  
    logout() {
      localStorage.removeItem('logged_user' );
      localStorage.removeItem('logged_name' );
      localStorage.removeItem('logged_email');
      localStorage.removeItem('logged_token');
      localStorage.removeItem('redirectUrl' );
      this.loggedIn.next(false);
      this.navigationService.navigateTo('/login'); 
    }
  
    getUser(field_name: string='') {
      if (field_name==='logged_name') {
        return localStorage.getItem('logged_name') || '';
      };
      if (field_name==='logged_email') {
        return localStorage.getItem('logged_email') || '';
      };
      return localStorage.getItem('logged_user') || '';
    }
  
    isLoggedIn(): boolean {
      const token = localStorage.getItem('logged_token');
      if (!token) {
          return false;
      }
      // Aici poți adăuga o verificare suplimentară pentru token (de exemplu, dacă este expirat)
      return true;
    }
}