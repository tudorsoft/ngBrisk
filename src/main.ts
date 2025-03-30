//main.ts:
//---------
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoadingInterceptor } from './app/services/loading.interceptor';
import { AuthGuard } from './app/services/auth.guard';
import { MenuTree } from './app/components/menu/menu-tree';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    AuthGuard,
    MenuTree
  ]
}).catch(err => console.error(err));
/*
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

const appWithHttpClient = {
  ...appConfig
};

bootstrapApplication(
  AppComponent, 
  { providers: [provideHttpClient()] }
).catch(err => console.error(err));
*/