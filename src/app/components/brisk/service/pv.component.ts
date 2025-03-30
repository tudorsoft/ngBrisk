//pv.component.ts:
//----------------------
import { HttpClient        } from '@angular/common/http';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule      } from '@angular/common';
import { StorageService    } from '../../../services/storage.service';
import { ErrorService      } from '../../../services/error.service';
import { DataTableComponent} from '../../data-table.component';
import * as DateUtils from '../../../utils/date.utils';

interface ColumnDefinition {
  label: string;
  name: string;
  type: string;
  showTotal?: boolean;
  decimals?: number;
  width?: string;
}

@Component({
  selector: 'app-pv',
  //standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './pv.component.html',
  styleUrls: ['./pv.component.scss'],
})
export class PvComponent implements OnInit {
  columns: ColumnDefinition[] = [
    //{ label: 'ID', name: 'id', type: 'numeric', width: '70px' },
    { label: 'Data', name: 'data_doc', type: 'date' },
    { label: 'Numar', name: 'numar', type: 'text' },
    { label: 'Client', name: 'den_firma', type: 'text' },
    { label: 'P.Lucru', name: 'den_plfrm', type: 'text' },
    { label: 'Categ.', name: 'den_comcat', type: 'text' },
    //{ label: 'Denumire Furnizor', name: 'supplierName', type: 'text' },
    //{ label: 'Valoare', name: 'amount', type: 'numeric', showTotal: true, decimals: 2 },
  ];
  // Definim câmpurile de filtrare specifice pentru această componentă
  filterFields = [
    { label: 'De la', type: 'date', name: 'cDataI', 
      defaultValue: DateUtils.formatDate(new Date(new Date().getFullYear(), new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1, 1)) },
    { label: 'până la', type: 'date', name: 'cDataS', 
      defaultValue: DateUtils.formatDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)) },
  ];

  @Output() dataUpdated = new EventEmitter<any[]>();
  filteredData: any[] = [];
  errorMessage: string | null = null;
  recordCount: number = 0; 
  filterValues: any = {}; // Obiect pentru a stoca valorile filtrelor
  filterDatabase: any[] = []; // Obiect pentru a stoca filtrele în format { name, value }
  selectedColumns: string[] = this.columns.map(col => col.name );
  columnLabels   : string[] = this.columns.map(col => col.label);

  constructor( public storageService: StorageService, 
               private errorService: ErrorService,
               private http: HttpClient ) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData(filterDatabase?: any[]) {
    const apiUrl = (this.storageService.cDatabaseUrl.endsWith('/') ? 
                    this.storageService.cDatabaseUrl.slice(0, -1) : 
                    this.storageService.cDatabaseUrl);
    console.log('fetchData a fost apelat');
    if (apiUrl !== '') {
      const fullUrl = apiUrl + '/wngPv';
      const body: { [key: string]: any } = {};
      if (filterDatabase) {
        filterDatabase.forEach((filter) => {
          if (filter.value) {
            body[filter.name] = filter.value; // Adăugăm fiecare filtru în params
          }
        });
      }
      console.log( body );
      this.http.post<any[]>(fullUrl, body,
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        ).subscribe({
        next: (response) => {
          this.filteredData = [...response];
          this.recordCount = this.filteredData.length; 
          this.errorMessage = null;
          console.log('Datele au fost preluate:', this.filteredData);
          this.dataUpdated.emit(this.filteredData);
        },
        error: (error) => {
          console.error('Eroare accesare ' + fullUrl, error);
          this.errorMessage = this.errorService.getErrorMessage(error);
          this.filteredData = [];
          this.recordCount = 0;
        },
      });

    }
  }

  // Funcție pentru a actualiza valorile câmpurilor de filtrare
  onFilterChange(filterValues: any) {
    this.filterValues = filterValues;
    this.fetchData();
  }

  onResetFilters() {
    this.filterValues = {}; // Resetează valorile filtrelor
    this.fetchData(); // Reîmprospătează datele
  }

  // Funcția care este apelată când filterDatabase se schimbă
  onFilterDatabaseChange(filterDatabase: any[]) {
    this.fetchData(filterDatabase); // Trimitem filterDatabase către fetchData
  }
}