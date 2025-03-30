//navigation.service.ts:
//---------------------
import { Injectable, Inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(
        private router: Router
  ) {}

  navigateTo(route: string): Promise<boolean> {
    return this.router.navigate([route]);
  }

  reloadCurrentRoute(): void {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/home', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
}