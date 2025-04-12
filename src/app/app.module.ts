//app.module.ts:
//-------------
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { LoadingInterceptor } from './services/loading.interceptor';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { RouterModule     } from '@angular/router';
import { AppComponent  } from './app.component';
import { MenuTree }  from './components/menu/menu-tree'; 
import { AuthGuard } from './services/auth.guard';

@NgModule({
  declarations: [ 
    AppComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  exports: [RouterModule],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    AuthGuard,
    MenuTree
  ],
  bootstrap: [AppComponent] 
})
export class AppModule { 

  constructor() {

  }
}