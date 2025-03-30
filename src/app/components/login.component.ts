//login.component.ts:
//------------------
import { Component      } from '@angular/core';
import { CommonModule   } from '@angular/common';
import { FormsModule    } from '@angular/forms'; 
import { AuthService    } from '../services/auth.service';
import { NavigationService } from '../services/navigation.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(
      public authService: AuthService, 
      public storageService: StorageService,
      private navigationService: NavigationService,
    ) { }

    ngOnInit() {
      this.authService.loginStatus.subscribe(isLoggedIn => {
          if (this.authService.isLoggedIn()) {
              const redirectUrl = localStorage.getItem('redirectUrl') || '/home';
              this.navigationService.navigateTo(redirectUrl);
          }
          else {
            this.navigationService.navigateTo('/login');
          }
      });
    }    

    login() {
      this.authService.login(this.username, this.password);
    }
}