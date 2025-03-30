//app.module.ts:
//-------------
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { RouterModule     } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';
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
    FormsModule 
  ],
  exports: [RouterModule],
  providers: [
    AuthGuard,
    MenuTree,
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
  ],
  bootstrap: [AppComponent] 
})
export class AppModule { 

  constructor() {

  }
}