//data-table-detail.component.ts:
//------------------------------
import { Component, Input, Output, OnInit, AfterViewChecked, EventEmitter, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators'; 
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SectionDefinition, FieldDefinition } from './type-definition';
import { StorageService } from '../services/storage.service';
import { HttpProxyService } from '../services/http-proxy.service';
import { getSqlString } from '../utils/sql.utils';

@Component({
  selector: 'app-data-table-detail',
  imports: [CommonModule, FormsModule], 
  templateUrl: './data-table-detail.component.html',
  styleUrls: ['./data-table-detail.component.scss'] 
})
export class DataTableDetailComponent {
  @Input() sections: SectionDefinition[] = [];
  @Input() currentRecordDetail: any;
  @Input() fieldValues: { [key: string]: any } = {};
  @Output() detailRequested = new EventEmitter<any>();

  detailMode: boolean = false;
  activeSection: SectionDefinition | null = null;
  currentRecord: any = null;
  autocompleteOptions: { [fieldName: string]: string[] } = {};

  constructor(
    private storageService: StorageService,
    private http: HttpClient,
    private httpProxyService: HttpProxyService,
    private cd: ChangeDetectorRef
  ) { }
  
ngOnChanges(changes: SimpleChanges) {
  /*if (changes['currentRecordDetail']) {
    console.log('currentRecordDetail s-a actualizat:', this.currentRecordDetail);
  }*/
}

  // Apelată la dublu-click pe o înregistrare din listă
  openDetail(record: any): void {
    console.log('openDetail primit record:', record);
    this.detailMode = true;
    this.currentRecord = record;
    if (this.sections && this.sections.length > 0) {
      this.activeSection = this.sections[0];
    }
    // Emite evenimentul către părinte
    this.detailRequested.emit(record);
  }

  backToList() {
    this.detailMode = false;
  }

  selectSection(section: SectionDefinition): void {
    this.activeSection = section;
  }

  getFieldValue(fieldName: string): string {
    let record = this.currentRecordDetail[0];
    /*if (Array.isArray(record)) {
      record = record[0];
    } */
    const value = record && record[fieldName] ? record[fieldName] : '';
    console.log(`Valoarea pentru ${fieldName}:`, value);
    return value;
  }


  getGroupedFields(section: SectionDefinition): FieldDefinition[][] {
    if (!section.fields || section.fields.length === 0) {
      return [];
    }
    const groups: { [key: string]: FieldDefinition[] } = {};
    section.fields.forEach(field => {
      const grp = field.group || 'default';
      if (!groups[grp]) {
        groups[grp] = [];
      }
      groups[grp].push(field);
      //console.log('getGroupedFields: ',field.name+' '+field.type+' '+field.sql);
    });
    // Convertim obiectul în array. Dacă dorești o ordine specifică, poți sorta array-ul după cheie.
    return Object.keys(groups).map(key => groups[key]);
  }

  getTableRows(section: SectionDefinition): any[] {
    // Presupunem că pentru secțiunea tabelară, currentRecordDetail are proprietatea cu numele secțiunii
    if (this.currentRecordDetail && this.currentRecordDetail[section.name]) {
      return this.currentRecordDetail[section.name];
    }
    return [];
  }

  ngAfterViewInit() {
    // codul tău pentru măsurare, etc.
  }

  onAutocompleteInput(field: FieldDefinition, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value;
    
    if (inputValue && inputValue.length >= 2) {
      const body: { [key: string]: any } = {};
            body['autocomplete'] = true;
            body['sql'] = getSqlString(field.sql || '', inputValue) || '';
      ///////////////////
      this.httpProxyService.post<any[]>(
              `${this.storageService.cDatabaseUrl}/wngSQL`,
              body,
              undefined,
              new HttpHeaders({ 'Content-Type': 'application/json' })
            ).pipe(
                tap({
                  next: (options: string[]) => {
                    console.log(options);
                    this.autocompleteOptions[field.name] = options;
                    this.cd.detectChanges();
                  },
                  error: (err: any) => {
                    console.error('Autocomplete error:', err);
                    this.autocompleteOptions[field.name] = [];
                  }
                })
              ).subscribe();
      //////////////////////
    } else {
      this.autocompleteOptions[field.name] = [];
    }
  }

  selectAutocompleteOption(field: FieldDefinition, option: string) {
    this.fieldValues[field.name] = option;
    this.autocompleteOptions[field.name] = [];
  }

  onAutocompleteButtonClick(field: FieldDefinition): void {
    const currentValue = this.fieldValues[field.name] || '';
    // Convertim obiectul la unknown, apoi la Event
    this.onAutocompleteInput(field, { target: { value: currentValue } } as unknown as Event);
  }

}
