//data-table-detail.component.ts:
//------------------------------
import { Component, Input, Output, OnInit, AfterViewChecked, EventEmitter, ChangeDetectorRef, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, startWith, switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators  } from '@angular/forms';
import { SectionDefinition, FieldDefinition, MY_DATE_FORMATS } from './type-definition';
import { StorageService } from '../services/storage.service';
import { HttpProxyService } from '../services/http-proxy.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { getSqlString } from '../utils/sql.utils';

@Component({
  selector: 'app-data-table-detail',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, 
    MatDatepickerModule, MatNativeDateModule], 
  templateUrl: './data-table-detail.component.html',
  styleUrls: ['./data-table-detail.component.scss'], 
  encapsulation: ViewEncapsulation.None
})
export class DataTableDetailComponent implements OnInit {
  @Input() sections: SectionDefinition[] = [];
  @Input() currentRecordDetail: any[] = [];
  @Input() fieldValues: { [key: string]: any } = {};
  @Output() detailRequested = new EventEmitter<any>();
  @Output() closeDetail: EventEmitter<void> = new EventEmitter<void>();

  formGroup!: FormGroup;
  detailMode: boolean = false;
  activeSection: SectionDefinition | null = null;
  currentRecord: any = null;
  groupedFields: FieldDefinition[][] = [];
  autocompleteOptions: { [fieldName: string]: any[] } = {};

  constructor(
    private storageService: StorageService,
    private httpProxyService: HttpProxyService,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    // Inițializare dinamică a formularului, pe baza secțiunilor și câmpurilor
    const group: { [key: string]: FormControl } = {};

    this.sections.forEach(section => {
      section.fields?.forEach(field => {
        // Se poate aplica logica de validare specifică fiecărui tip
        group[field.name] = this.fb.control('', Validators.required);
      });
    });

    this.formGroup = this.fb.group(group);

  }

  // Metodă helper care returnează controlul ca FormControl
  getControl(name: string): FormControl {
    const control = this.formGroup.get(name) as FormControl;
    return control;
  }

  selectSection(section: SectionDefinition): void {
    this.activeSection = section;
    this.groupedFields = this.getGroupedFields(section);
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
    if (this.currentRecordDetail && Array.isArray(this.currentRecordDetail)) {
      // Dacă secțiunea este "Manopera", presupunem că datele tabelare se află în record.manopera
      if (section.name === 'manopera') {
        return this.currentRecordDetail[0]?.manopera || [];
      }
      // Pentru celelalte secțiuni, folosește filtrarea standard
      return this.currentRecordDetail.filter((record: any) => record.name === section.name);
    }
    return [];
  }

  ngAfterViewInit() {
    // codul tău pentru măsurare, etc.
  }

  getFieldDefinition(fieldName: string): FieldDefinition | undefined {
    if (!this.activeSection || !this.activeSection.fields) {
      return undefined;
    }
    return this.activeSection.fields.find(field => field.name === fieldName);
  }
  
  // Metoda simplificată pentru afișarea valorilor
  getFieldValue(fieldName: string): string {
    if (this.currentRecordDetail && Array.isArray(this.currentRecordDetail)) {
      let record = this.currentRecordDetail[0];
      return record && record[fieldName] ? record[fieldName] : '';
    }
    return '';
  } 

  onCancel() {
    this.detailMode = false;
    this.closeDetail.emit();
  }
  onSave() {
    this.detailMode = false;
    this.closeDetail.emit();
  }

  openDetail(record: any): void {
    console.log('openDetail primit record:', record);
    this.detailMode = true;
    this.currentRecord = record;
    this.currentRecordDetail = [record];
    this.fieldValues = { ...record };
  
    if (this.sections && this.sections.length > 0) {
      this.activeSection = this.sections[0];
      // Actualizează groupedFields doar când activeSection se stabilește
      this.groupedFields = this.getGroupedFields(this.activeSection);
    }
  
    // (Opțional) reconstruieste formularul dacă e nevoie
    this.buildForm();
  
    this.cd.detectChanges();
  }

  buildForm(): void {
    // Obiectul în care adăugăm controlurile pentru fiecare câmp
    const controls: { [key: string]: FormControl } = {};
  
    // Pentru fiecare secțiune din inputul sections
    this.sections.forEach(section => {
      // Dacă secțiunea are câmpuri definite
      if (section.fields) {
        section.fields.forEach(field => {
          // Dacă se dorește inițializarea cu o valoare din fieldValues (în cazul în care se deschide un record existent)
          const defaultValue = this.fieldValues && this.fieldValues[field.name] !== undefined
                               ? this.fieldValues[field.name]
                               : '';
          // Creăm controlul cu valoarea implicită și, de exemplu, validare required
          controls[field.name] = this.fb.control(defaultValue, Validators.required);
        });
      }
    });
  
    // Construim FormGroup-ul pe baza controlurilor adunate
    this.formGroup = this.fb.group(controls);
  
    // Notifică schimbarea dacă este necesar (opțional)
    this.cd.detectChanges();
  }

  onInputChange(event: Event, field: FieldDefinition): void {
    const target = event.target;
    if (target) {
      const inputElement = target as HTMLInputElement;
      this.triggerAutocomplete(field, inputElement);
    } else {
      console.error('Event target is null for field', field.name);
    }
  }

  triggerAutocomplete(field: FieldDefinition, inputElement: HTMLInputElement): void {
    if ( inputElement.value && inputElement.value.length >= 1 ) {
      const body: { [key: string]: any } = {
        autocomplete: true,
        sql: getSqlString(field.sql || '', inputElement.value) || ''
      };
      this.httpProxyService.post<any[]>(`${this.storageService.cDatabaseUrl}/wngSQL`, body,
         undefined, new HttpHeaders({ 'Content-Type': 'application/json' })
      ).subscribe(
        (options) => {
          this.autocompleteOptions[field.name] = options;
          //if (options && options.length > 0) {
            //this.autocompleteStates[field.name] = true;
          //} else {
           // this.autocompleteStates[field.name] = false;
          //}
          this.cd.detectChanges();
        },
        (error) => {
          console.error('Autocomplete error:', error);
          this.autocompleteOptions[field.name] = [];
          this.cd.detectChanges();
        }
      );
    } else {
      // Dacă valoarea nu este suficientă pentru autocomplete, golim opțiunile
      this.autocompleteOptions[field.name] = [];
    }
  }

  displayAutocompleteFactory(fieldName: string): (option: any) => string {
    return (option: any): string => {
      if (!option) {
        return '';
      }
      // Dacă este un string, returnează-l
      if (typeof option === 'string') {
        return option;
      }
      // Dacă este un obiect, încearcă să returneze proprietatea specificată
      return option[fieldName] ? option[fieldName] : '';
    };
  }

  onInputFocus(event: Event, field: FieldDefinition): void {
    const target = event.target;
    if (target) {
      const inputElement = target as HTMLInputElement;
      this.triggerAutocomplete(field, inputElement);
    }
  }

} 