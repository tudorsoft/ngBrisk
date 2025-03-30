//companies.component.ts:
//----------------------
import { HttpClientModule } from '@angular/common/http';
import { HttpClient        } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule      } from '@angular/common';
import { StorageService    } from '../../services/storage.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.scss'],
})
export class CompaniesComponent implements OnInit {
  data: any = []; // Variabilă pentru a stoca datele primite din webservice
  cUrl: string = ''; // Fără 'null'
  constructor( public storageService: StorageService, private http: HttpClient ) {}

  ngOnInit() { }

  fetchData() {
    const apiUrl = (this.storageService.cDatabaseUrl.endsWith('/') ? this.storageService.cDatabaseUrl.slice(0, -1) : this.storageService.cDatabaseUrl);
    if (apiUrl !== '') {
      const fullUrl = apiUrl + '/wngMenu';
      this.http.get<any[]>(fullUrl).subscribe(response => {
        this.data = response; // Salvează datele primite
        console.log( 'Meniul este:', response );
      }, error => {
        console.error('Eroare accesare '+fullUrl, error);
      });
    }
  }

}