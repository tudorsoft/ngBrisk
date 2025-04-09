//menu.service.ts:
//-----------------
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';
import { HttpProxyService } from '../services/http-proxy.service';

export interface MenuItem {
  label: string;
  route?: string;
  component?: string; // Numele componentelor care vor fi folosite dinamic
  children?: MenuItem[];
}

@Injectable({
  providedIn: 'root'
})

export class MenuService {
  constructor(
      private httpProxyService: HttpProxyService,
      private storageService: StorageService) {
  }
  getMenu(): Observable<MenuItem[]> {
    let apiUrl = this.storageService.cDatabaseUrl;
    if (!apiUrl) {
      throw new Error('URL-ul API-ului nu este setat.');
    }
    return this.httpProxyService.get<MenuItem[]>(apiUrl + '/wngMenu').pipe(
      tap({
        next: (menuItems) => {
          // console.log('MenuService items received from API via proxy:', menuItems);
        },
        error: (err) => {
          console.warn('Error fetching menu items via proxy:', err);
        }
      })
    );
  }
}