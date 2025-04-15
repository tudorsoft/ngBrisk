// loading.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from './loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {
    console.log('LoadingInterceptor instantiated');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    const isAutocomplete = req.body && req.body.autocomplete === true;

    
    if (!isAutocomplete) {
      this.loadingService.show();
    }
    return next.handle(req).pipe(
      finalize(() => {
        
        if (!isAutocomplete) {
          this.loadingService.hide();
        }
        //console.log('LoadingInterceptor: Request finished', req.url);
      })
    );
  }
}