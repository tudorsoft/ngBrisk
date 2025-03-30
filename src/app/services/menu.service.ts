//menu.service.ts:
//-----------------
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';

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
  private apiUrl: string;
  constructor(private http: HttpClient, private storageService: StorageService) {
    this.apiUrl = this.storageService.cDatabaseUrl.endsWith('/') ?
                  this.storageService.cDatabaseUrl.slice(0, -1) + '/wngMenu' :
                  this.storageService.cDatabaseUrl + '/wngMenu';
  }
  getMenu(): Observable<MenuItem[]> {
    let apiUrl = this.storageService.cDatabaseUrl;
    if (!apiUrl) {
      throw new Error('URL-ul API-ului nu este setat.');
    }
    apiUrl = apiUrl + '/wngMenu';
    return this.http.get<MenuItem[]>(apiUrl).pipe(
      tap({
        next: (menuItems) => {
          //console.log('MenuService items received from API:', menuItems);
        },
        error: (err) => {
          console.warn('Error fetching menu items:', err);
        }
      })
    );
  }
}