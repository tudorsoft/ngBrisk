//menu-tree.ts: 
//------------
import { Injectable } from '@angular/core';
import { Routes } from '@angular/router';
import { Observable } from 'rxjs'; // Import pentru Observable
import { tap } from 'rxjs/operators'; 
import { AuthGuard } from '../../services/auth.guard';
import { MenuService, MenuItem } from '../../services/menu.service'; // Importă serviciul și tipul MenuItem

import { PvComponent              } from '../brisk/service/pv.component';
import { InvoicesIComponent       } from '../documents/inbounds/invoices_i.component';
import { FiscalReceiptsIComponent } from '../documents/inbounds/fiscal_receipts_i.component';
import { InvoicesOComponent       } from '../documents/outbounds/invoices_o.component';
import { FiscalReceiptsOComponent } from '../documents/outbounds/fiscal_receipts_o.component';
import { CompaniesComponent       } from '../nomenclatures/companies.component';

@Injectable({
  providedIn: 'root',
})

export class MenuTree {
  constructor(private menuService: MenuService) {}
  // Funcția care creează rutele pe baza structurilor dinamic obținute
  createRoutes(menuItems: MenuItem[], guards: any[] = []): Routes {
    const routes: Routes = [];
    menuItems.forEach(item => {
      if (item.route && item.component) {
        //console.log('Creating route for item:', item); 
        const path = item.route.startsWith('/') ? item.route.substring(1) : item.route;
        routes.push({
          path: path,
          component: this.getComponentByName(item.component),
          canActivate: [AuthGuard],
          //canActivate: guards.length > 0 ? guards : [],
        });
      }
      if (item.children) {
        routes.push(...this.createRoutes(item.children, guards)); // Recursiv pentru copii
      }
    });
    //console.log('Routes created:', routes);
    return routes;
  }

  // Funcția pentru a obține componentele pe baza numelui
  private getComponentByName(componentName: string): any {
    const components: { [key: string]: any } = {
      'PvComponent': PvComponent,
      'InvoicesIComponent': InvoicesIComponent,
      'FiscalReceiptsIComponent': FiscalReceiptsIComponent,
      'InvoicesOComponent': InvoicesOComponent,
      'FiscalReceiptsOComponent': FiscalReceiptsOComponent,
      'CompaniesComponent': CompaniesComponent,
    };

    return components[componentName] || null; // Returnează componenta corectă
  }

    getMenuFromApi(): Observable<MenuItem[]> {
      return this.menuService.getMenu().pipe(
        tap((menuItems: MenuItem[]) => { // Specifică tipul aici
          console.log('MenuTree items received from API:', menuItems);
        })
      );
    }
}

export type { MenuItem } from '../../services/menu.service';
