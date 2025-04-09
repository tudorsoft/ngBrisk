//storage.service.ts:
//------------------
import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { catchError      } from 'rxjs';
import { of              } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private cDatabaseUrlSubject = new BehaviorSubject<string>('');
  cDatabaseUrl$ = this.cDatabaseUrlSubject.asObservable();

  constructor(
      private http: HttpClient,
      @Inject(PLATFORM_ID) private platformId: Object) {}

  setVar(varName: string, varValue: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(varName, varValue);
    } else {
      console.warn('localStorage nu este disponibil pe server.');
    }
  }

  getVar(varName: string): string {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem(varName) || '' : ''; // Returnează întotdeauna un string
  }

  clearVar(varName: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(varName);
    } else {
      console.warn('localStorage nu este disponibil pe server.');
    }
  }

  get cDatabaseUrl(): string {
    return this.cDatabaseUrlSubject.value;
  }
  
  async testIPs(): Promise<string> {
    const ipLocal    = environment.cDatabaseUrlLocal;
    const ipExternal = environment.cDatabaseUrlExternal;
    const timeout = 5000; // 5 secunde
    
    const testIp = (url: string): Promise<string | null> => {
      console.log('testIP: ', url);
      let testUrl = url + '/wngLogin';
      return this.http
        .get(testUrl)
        .pipe(
          catchError(() => of(null))
        )
        .toPromise()
        .then(() => url)
        .catch(() => null);
    };

    // Construim lista de promisiuni în funcție de environment.useProxy
    let testPromises: Promise<string | null>[];
    if (environment.useProxy === false) {
      testPromises = [ testIp(ipLocal), testIp(ipExternal) ];
    } else {
      testPromises = [ testIp(ipExternal) ];
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    );

    try {
      const result = await Promise.race([ ...testPromises, timeoutPromise ]);
      if (typeof result === 'string') {
        return result; // Returnăm IP-ul care a răspuns
      } else {
        throw new Error('Nu ne putem conecta la baza de date.');
      }
    } catch (error) {
      throw new Error('Nu ne putem conecta la baza de date.');
    }
  }

  async loadConfig(): Promise<void> {
    try {
      let activeDatabaseUrl = await this.testIPs();
      if (activeDatabaseUrl.endsWith('/')) {
        activeDatabaseUrl = activeDatabaseUrl.slice(0, -1);
      }
      this.cDatabaseUrlSubject.next(activeDatabaseUrl);
      localStorage.setItem('cDatabaseUrl', activeDatabaseUrl);
      console.log('IP functional:', activeDatabaseUrl);
    } catch (error) {
      console.error('Eroare la testarea IP-urilor:', error);
    }
  }

} 