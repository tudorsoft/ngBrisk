//error.service.ts:
//----------------
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // Serviciul este disponibil global
})
export class ErrorService {
  getErrorMessage(error: any): string {
    if (error.error instanceof ErrorEvent) {
      // Eroare de client
      return `Eroare de client: ${error.error.message}`;
    } else {
      // Eroare de server
      const serverError = error.error;
      if (serverError && serverError.message) {
        return `Eroare de server: ${serverError.message}`;
      } else {
        return `Eroare de server: ${error.message || 'Conexiunea la server a eșuat'}`;
      }
    }
  }
}
