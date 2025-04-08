//http-proxy.service.ts:
//---------------------
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpProxyService {

  private proxyUrl = 'web-proxy.php'; // asigură-te că acest fișier se află la același nivel cu index.html

  constructor(private http: HttpClient) {}

  get<T>(apiUrl: string, params?: HttpParams, headers?: HttpHeaders): Observable<T> {
    // Construiți URL-ul complet pentru proxy, codificând URL-ul API
    const fullUrl = `${this.proxyUrl}?api=${encodeURIComponent(apiUrl)}`;
    return this.http.get<T>(fullUrl, { params, headers });
  }

  post<T>(apiUrl: string, body: any, params?: HttpParams, headers?: HttpHeaders): Observable<T> {
    const fullUrl = `${this.proxyUrl}?api=${encodeURIComponent(apiUrl)}`;
    return this.http.post<T>(fullUrl, body, { params, headers });
  }
  
  // Poți extinde cu metode pentru PUT, DELETE etc.
}