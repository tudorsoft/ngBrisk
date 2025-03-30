//main.ts:
//---------
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
