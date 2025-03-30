//menu-state.service.ts:
//--------------------
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuStateService {
  private isMenuVisible = new BehaviorSubject<boolean>(false); // Folosește BehaviorSubject
  isMenuVisible$ = this.isMenuVisible.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
) {}

toggleMenu() {
  if (isPlatformBrowser(this.platformId)) {
    const newValue = !this.isMenuVisible.value;
    console.log('New menu state:', newValue);
    this.isMenuVisible.next(newValue); // Actualizează starea
  }
}

  closeMenu() {
    if (isPlatformBrowser(this.platformId) ) {
      this.isMenuVisible.next(false);
    }
  }
}