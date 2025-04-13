//pv.component.ts:
//----------------------
import { HttpHeaders } from '@angular/common/http';
import { Component, ChangeDetectorRef, OnInit, ViewChild, AfterViewInit, Output, EventEmitter } from '@angular/core';
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
    { label: 'Data', name: 'data_doc', type: 'date', fixed: "left", width: '100px',  placeholder: 'data P.V.' },
    { label: 'S', name: 'semnat', type: 'check', width: '36px', align: 'center',
      colorMapping: (value: any) => {
        if (value === 0) { return 'red'; } else 
        if (value === 1) { return 'lightgreen'; } else 
        if (value === 2) { return '#485F99'; } else { return 'transparent'; }
      }
    },
    { label: 'A', name: 'nrfis', type: 'check', width: '36px', align: 'center',
      pictureMapping: (value: any) => {
        if (value === 1) return '/assets/attachment.png'; else return '';
      }
    },
    { label: 'Numar', name: 'numar', type: 'text', fixed: "left", placeholder: 'numar P.V.', width: '80px' },
    { label: 'Client', name: 'den_firma', type: 'text', placeholder: 'denumire client' },
    { label: 'P.Lucru', name: 'den_plfrm', type: 'text', placeholder: 'punct lucru' },
    { label: 'Categ.', name: 'den_comcat', type: 'text',  placeholder: 'categorie P.V.' },
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
        { label: 'Categ.', name: 'den_comcat', type: 'autocomplete', group: '3', sql: 'service.comenzicateg', autocomplete: true  },
        { label: 'Client', name: 'den_firma', type: 'autocomplete', group: '4', sql: 'facturi.firme', autocomplete: true },
        { label: 'P.Lucru', name: 'den_plfrm', type: 'autocomplete', group: '5', sql: 'facturi.firme_pl', autocomplete: true },
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

  @ViewChild('wrapper') wrapper!: DataTableDetailComponent;

  constructor( public storageService: StorageService, 
               private errorService: ErrorService,
               private httpProxyService: HttpProxyService, 
               private cd: ChangeDetectorRef ) {}

  ngOnInit() {
    this.fetchData();
  }

  ngAfterViewInit(): void {
    // La acest moment, 'wrapper' ar trebui să fie disponibil
    //if (!this.wrapper) {
    //  console.error('Wrapper-ul pentru data-table-detail nu a fost găsit!');
    //}
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

  onRecordDblClick(event: any): void {
    const record = event && event.record ? event.record : event;
    const editMode = event && typeof event.editMode !== 'undefined' ? event.editMode : true;
  
    if (editMode) {
      // Fluxul pentru modificare – la dublu-click se apelează fetchDataDetail
      if (record && record.id) {
        this.fetchDataDetail(record.id, true);
      } else {
        console.warn('"record" nu conține un id valid.');
      }
    } else {
      // Flux pentru Adăugare: construim un obiect gol folosind secțiunile
      const emptyDetailRecord: any = {};
      // Adaugă proprietatea 'id' ca sa functioneze ecran detalii cu campuri goale (la adaugare)
      emptyDetailRecord['id'] = '';
      // Inițializează toate câmpurile din secțiuni
      this.sections.forEach(section => {
        if (section.fields) {
          section.fields.forEach(field => {
            emptyDetailRecord[field.name] = '';
          });
        }
      });
      console.log('Empty detail record pentru Adăugare:', emptyDetailRecord);
      this.currentRecordDetail = [emptyDetailRecord];
      this.fieldValues = emptyDetailRecord;
      if (this.wrapper) {
        this.wrapper.openDetail(emptyDetailRecord);
      } else {
        console.error('Wrapper-ul nu este disponibil!');
      }
      this.cd.detectChanges();
    }
  }

  fetchData(filterDatabase?: any[]) {
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
    this.httpProxyService.post<any[]>(  this.storageService.cDatabaseUrl+'/wngPV', body,
      undefined, new HttpHeaders({ 'Content-Type': 'application/json' })
    ).subscribe({
      next: response => {
        this.filteredData = [...response];
        this.recordCount = this.filteredData.length;
        this.errorMessage = null;
        console.log('Datele au fost preluate:', this.filteredData);
        this.dataUpdated.emit(this.filteredData);
      },
      error: error => {
        console.error('Eroare accesare ', error);
        this.errorMessage = this.errorService.getErrorMessage(error);
        this.filteredData = [];
        this.recordCount = 0;
      }
    });
  }

  fetchDataDetail(recordId: string, openAfterFetch: boolean = false) {
    // Resetăm valorile curente
    this.fieldValues = {};
    this.currentRecordDetail = null;
    this.cd.detectChanges();
  
    const apiEndpoint = this.storageService.cDatabaseUrl + '/wngPv';
    const body = { id: recordId };
  
    this.httpProxyService.post<any>(apiEndpoint, body,
      undefined, new HttpHeaders({ 'Content-Type': 'application/json' })
    ).pipe(
      tap({
        next: (detailData) => {
          // Extragem recordul din răspuns; dacă nu este un array, folosim direct
          const record = Array.isArray(detailData) ? detailData[0] : detailData;
          // Asigurăm forma de array (deoarece getFieldValue se bazează pe currentRecordDetail[0])
          this.currentRecordDetail = [record];
          this.fieldValues = record || {};
          console.log('Detaliile primite:', record);
          this.cd.detectChanges();
          // Dacă suntem în fluxul de modificare și s-a specificat openAfterFetch, deschidem ecranul de detalii
          if (openAfterFetch && this.wrapper) {
            this.wrapper.openDetail(record);
          }
        },
        error: (err) => {
          console.error('Eroare la preluarea detaliilor:', err);
        }
      })
    ).subscribe();
  }

}