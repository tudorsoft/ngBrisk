//pv.component.ts:
//----------------------
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, ChangeDetectorRef, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule      } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { tap } from 'rxjs/operators'; 
import { Observable } from 'rxjs';

import { StorageService, HttpProxyService, ErrorService, ColumnDefinition, SectionDefinition, DataTableComponent, DataTableDetailComponent, environment } from '../../../components';
import * as DateUtils from '../../../utils/date.utils';

@Component({
  selector: 'app-pv',
  imports: [CommonModule, DataTableComponent, DataTableDetailComponent],
  templateUrl: './pv.component.html',
  styleUrls: ['./pv.component.scss'],
})
export class PvComponent implements OnInit {

//Coloane ecran lista:
//-------------------
  columns : ColumnDefinition[] = [
    //{ label: 'ID', name: 'id', type: 'numeric', width: '70px' },
    { label: 'Data', name: 'data_doc', type: 'date', fixed: "left", width: '100px' },
    { label: 'S', name: 'semnat', type: 'check', width: '32px', align: 'center',
      colorMapping: (value: any) => {
        if (value === 0) { return 'red'; } else 
        if (value === 1) { return 'lightgreen'; } else 
        if (value === 2) { return '#485F99'; } else { return 'transparent'; }
      }
    },
    { label: 'A', name: 'nrfis', type: 'check', width: '32px', align: 'center',
      pictureMapping: (value: any) => {
        if (value === 1) return '/assets/attachment.png'; else return '';
      }
    },
    { label: 'Numar', name: 'numar', type: 'text', fixed: "left" },
    { label: 'Client', name: 'den_firma', type: 'text' },
    { label: 'P.Lucru', name: 'den_plfrm', type: 'text' },
    { label: 'Categ.', name: 'den_comcat', type: 'text' },
    { label: 'Facturat', name: 'facturat', type: 'check', align: 'center', width: "50px", fixed: "right"},
    //{ label: 'Valoare', name: 'valoare', type: 'numeric', showTotal: true, decimals: 2 },
  ];
  
  // Definim câmpurile de filtrare
  filterFields = [
    { label: '', type: 'date', name: 'cDataI', defaultValue: DateUtils.formatDate(new Date(new Date().getFullYear(), new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1, 1)) },
    { label: '', type: 'date', name: 'cDataS', defaultValue: DateUtils.formatDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)) },
    //{ label: 'Client', type: 'text', name: 'cClient'},
  ];

//Sectiuni si campuri ecran detaliu:
//---------------------------------
  sections: SectionDefinition[] = [ 
    { label: 'Antet', name: 'antet', 
      fields: [
        { label: 'Data', name: 'data_doc', type: 'date', group: '1' },
        { label: 'Numar', name: 'numar', type: 'text', group: '2' },
        { label: 'Categ.', name: 'den_comcat', type: 'text', group: '3' },
        { label: 'Client', name: 'den_firma', type: 'autocomplete', group: '4', sql: 'facturi.firme', autocomplete: true },
        { label: 'P.Lucru', name: 'den_plfrm', type: 'text', group: '5' },
        { label: 'Subiect', name: 'asobssubiect', type: 'text', group: '6' },
        { label: 'Descriere', name: 'obs', type: 'textarea', group: '7' },
        { label: 'Persoana', name: 'aspersclient', type: 'text', group: '8' },
        { label: 'Facturat', name: 'facturat', type: 'check', align: 'left', group: '9' },
      ]
    },
    { label: 'Manopera', name: 'manopera', displayAsTable: true,
      fields: [
        { label: 'Persoana', name: 'persoana', type: 'text' },
        { label: 'Tip', name: 'cod_manop', type: 'combo' },
        { label: 'Sosire', name: 'sosire_data', type: 'date', group: 'sosire' },
        { label: 'ora', name: 'sosire_ora', type: 'numeric', group: 'sosire' },
        { label: 'min.', name: 'sosire_minut', type: 'combo', values: ['00','05','10','15','20','25','30','35','40','45','50','55'], group: 'sosire' },
        { label: 'Plecare', name: 'plecare_data', type: 'date', group: 'plecare' },
        { label: 'ora', name: 'plecare_ora', type: 'numeric', group: 'plecare' },
        { label: 'min.', name: 'plecare_minut', type: 'combo', values: ['00','05','10','15','20','25','30','35','40','45','50','55'], group: 'plecare' },
        // ...
      ]
    },
    { label: 'Pozitii', name: 'pozitii'},
    { label: 'Materiale', name: 'materiale'},
    { label: 'Observatii', name: 'observatii'},
    { label: 'Fisiere atasate', name: 'atas'},
  ];

  @Output() dataUpdated = new EventEmitter<any[]>();
  filteredData: any[] = [];
  errorMessage: string | null = null;
  recordCount: number = 0; 
  filterValues: any = {}; // Obiect pentru a stoca valorile filtrelor
  filterDatabase: any[] = []; // Obiect pentru a stoca filtrele în format { name, value }
  selectedColumns: string[] = this.columns.map(col => col.name );
  columnLabels   : string[] = this.columns.map(col => col.label);
  currentRecordDetail: any = null;
  fieldValues: { [key: string]: any } = {};
  autocompleteOptions: { [fieldName: string]: string[] } = {};

  constructor( public storageService: StorageService, 
               private errorService: ErrorService,
               private http: HttpClient,
               private httpProxyService: HttpProxyService, 
               private cd: ChangeDetectorRef ) {}

  ngOnInit() {
    this.fetchData();
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

  onFormReady(form: FormGroup): void {
    const filterDatabase = this.filterFields.map(field => ({
      name: field.name,
      value: form.get(field.name)?.value || '',
    }));
  
    this.fetchData(filterDatabase); // ✅ apel doar când formularul e gata
  }

  onRecordDblClick(record: any): void {
    if (record && record.id) {
      this.fetchDataDetail(record.id);
    } else {
      console.warn('"record" nu conține un id valid.');
    }
  }


  fetchData(filterDatabase?: any[]) {
    let baseUrl = this.storageService.cDatabaseUrl;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    const apiEndpoint = `${baseUrl}/wngPv`;
    const fullUrl = environment.useProxy
      ? 'web-proxy.php?api=' + encodeURIComponent(apiEndpoint)
      : apiEndpoint;
  
    // Construiește corpul cererii
    const body: { [key: string]: any } = {};
    if (filterDatabase) {
      filterDatabase.forEach(filter => {
        if (filter.value) {
          body[filter.name] = filter.value;
        }
      });
    }
    //console.log('Body JSON trimis:', body);
    let request$: Observable<any[]>;
    if (environment.useProxy) {
      request$ = this.httpProxyService.post<any[]>(
        apiEndpoint,
        body,
        undefined,
        new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
      );
    } else {
      request$ = this.http.post<any[]>(
        fullUrl,
        body,
        { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) }
      );
    }
  
    request$.subscribe({
      next: response => {
        this.filteredData = [...response];
        this.recordCount = this.filteredData.length;
        this.errorMessage = null;
        console.log('Datele au fost preluate:', this.filteredData);
        this.dataUpdated.emit(this.filteredData);
      },
      error: error => {
        console.error('Eroare accesare ' + fullUrl, error);
        this.errorMessage = this.errorService.getErrorMessage(error);
        this.filteredData = [];
        this.recordCount = 0;
      }
    });
  }



  fetchDataDetail(recordId: string) {
    // Resetează valorile curente
    this.fieldValues = {};
    this.currentRecordDetail = null;
    this.cd.detectChanges();
  
    let baseUrl = this.storageService.cDatabaseUrl;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    const apiEndpoint = `${baseUrl}/wngPv`;
    const body = { id: recordId };
    console.log('Fetching details from:', apiEndpoint, 'with body:', body);
  
    let request$: Observable<any>;
  
    if (environment.useProxy) {
      // Folosim httpProxyService care construiește URL-ul proxy intern
      request$ = this.httpProxyService.post<any>(
        apiEndpoint, 
        body, 
        undefined, 
        new HttpHeaders({ 'Content-Type': 'application/json' })
      );
    } else {
      // Folosim apelul direct
      request$ = this.http.post<any>(
        apiEndpoint, 
        body, 
        { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
      );
    }
  
    request$.pipe(
      tap({
        next: (detailData) => {
          // Presupunem că detailData este un array; extragem primul element
          const record = Array.isArray(detailData) ? detailData[0] : detailData;
          this.currentRecordDetail = record;
          this.fieldValues = record || {};
          console.log('fieldValues actualizat:', this.fieldValues);
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Eroare la preluarea detaliilor:', err);
        }
      })
    ).subscribe();
  }

}