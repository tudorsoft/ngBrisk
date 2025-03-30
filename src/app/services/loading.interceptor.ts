// loading.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from './loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Activează loading-ul înainte de a trimite request-ul
    this.loadingService.show();
    return next.handle(req).pipe(
      // La final (indiferent de succes sau eroare), dezactivează loading-ul
      finalize(() => this.loadingService.hide())
    );
  }
}