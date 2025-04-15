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
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatNativeDateModule } from '@angular/material/core';
import { getSqlString } from '../utils/sql.utils';
import { SetCustomWidthDirective } from './directive-custom-width';

@Component({
  selector: 'app-data-table-detail',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatCheckboxModule, 
    MatDatepickerModule, MatNativeDateModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, SetCustomWidthDirective], 
  templateUrl: './data-table-detail.component.html',
  styleUrls: ['./data-table-detail.component.scss'], 
  encapsulation: ViewEncapsulation.None
})
export class DataTableDetailComponent implements OnInit {
  @Input() title!: string;
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
  const group: { [key: string]: FormControl } = {};  // Inițializare dinamică a formularului, pe baza secțiunilor și câmpurilor
  this.sections.forEach(section => {
    section.fields?.forEach(field => {
      // Se poate aplica logica de validare specifică fiecărui tip
      group[field.name] = this.fb.control('', Validators.required);
    });
  });
  this.formGroup = this.fb.group(group);
}

getControl(name: string): FormControl { // Metodă helper care returnează controlul ca FormControl
  const control = this.formGroup.get(name) as FormControl;
  return control;
}

selectSection(section: SectionDefinition): void {
  this.activeSection = section;
  this.groupedFields = this.getGroupedFields(section);
}

getFieldWidth(field: FieldDefinition): string {
  return field.width ? field.width : '100%';
}

getGroupedFields(section: SectionDefinition): FieldDefinition[][] {
  if (!section.fields || section.fields.length === 0) {
    return [];
  }
  const groups: { [key: string]: FieldDefinition[] } = {};
  section.fields.forEach(field => {
    const grp = field.group || 'default'; // Dacă field.group nu este definit, folosește 'default'
    if (!groups[grp]) {
      groups[grp] = [];
    }
    groups[grp].push(field);
  });
  return Object.keys(groups).map(key => groups[key]); // Transformăm obiectul într-un array de array-uri
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
    //console.log('openDetail primit record:', record);
    this.detailMode = true;
    this.currentRecord = record;
    this.currentRecordDetail = [record];
    this.fieldValues = { ...record };
    if (this.sections && this.sections.length > 0) {
      this.activeSection = this.sections[0];
      this.groupedFields = this.getGroupedFields(this.activeSection); // Actualizează groupedFields doar când activeSection se stabilește
    }
  
    this.buildForm();
    this.cd.detectChanges();
  }

  buildForm(): void {
    const controls: { [key: string]: FormControl } = {};     // Obiectul în care adăugăm controlurile pentru fiecare câmp
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
  
    this.formGroup = this.fb.group(controls); // Construim FormGroup-ul pe baza controlurilor adunate
    this.cd.detectChanges();
  }

  isLoading: { [key: string]: boolean } = {};
  triggerAutocomplete(field: FieldDefinition, inputElement: HTMLInputElement): void {
    //if ( inputElement.value && inputElement.value.length >= 0 ) { //comentez pt a putea deschide toata lista daca da doar click pe buton
      let sqlDep = '';
      if (field.dependency) {
        const depControl = this.getControl(field.dependency.fieldName);
        const depValue = depControl.value;
        //console.log(this.currentRecord);
        if (depValue && field.dependency.sql && field.dependency.sqlval) {
          if (typeof depValue === 'object') {
            sqlDep = field.dependency.sql + `${depValue[field.dependency.sqlval]}`; // firme_pl.id_firma=${firma_id}
          } else {
            sqlDep = field.dependency.sql + `${this.currentRecord[field.dependency.sqlval]}`;
          }
          //console.log('sqlDep: ', sqlDep);
        } else {
          this.autocompleteOptions[field.name] = []; // Dacă nu există o valoare validă de la câmpul dependent, putem opțional să setăm lista la goală
          return;
        }
      }
      let sqlQuery = getSqlString(field.sql || '', inputElement.value,  sqlDep || '') || '';
      this.isLoading[field.name] = true;
      const body: { [key: string]: any } = {
        autocomplete: true,
        sql: sqlQuery
      };
      this.httpProxyService.post<any[]>(`${this.storageService.cDatabaseUrl}/wngSQL`, body,
         undefined, new HttpHeaders({ 'Content-Type': 'application/json' })
      ).subscribe(
        (options) => {
          this.autocompleteOptions[field.name] = options;
          this.isLoading[field.name] = false;
          this.cd.detectChanges();
        },
        (error) => {
          console.error('Autocomplete error:', error);
          this.autocompleteOptions[field.name] = [];
          this.isLoading[field.name] = false;
          this.cd.detectChanges();
        }
      );
    //} else {
    //  console.log('triggerAutocomplete: not inputElement');
    //  // Dacă valoarea nu este suficientă pentru autocomplete, golim opțiunile
    //  this.autocompleteOptions[field.name] = [];
    //}
  }

  displayAutocompleteFactory(fieldName: string): (option: any) => string {
    return (option: any): string => {
      if (!option) {
        return '';
      }
      if (typeof option === 'string') {
        return option;
      }
      return option[fieldName] ? option[fieldName] : '';
    };
  }

private suppressAutoOpen = false;
togglePanel(trigger: MatAutocompleteTrigger, inputElement: HTMLInputElement): void {
  if (trigger.panelOpen) {
    this.suppressAutoOpen = true;
    trigger.closePanel();
    inputElement.blur();
  } else {
    this.suppressAutoOpen = false;
    trigger.openPanel();
    inputElement.focus();
  }
}
onInputFocus(event: Event, field: FieldDefinition, trigger: MatAutocompleteTrigger): void {
  if (this.suppressAutoOpen) {
    trigger.closePanel();
    const inputElement = event.target as HTMLInputElement;
    inputElement.blur();
    this.suppressAutoOpen = false;
    return;
  }
  const target = event.target;
  if (target) {
    const inputElement = target as HTMLInputElement;
    this.triggerAutocomplete(field, inputElement);
  }
}
onInputChange(event: Event, field: any, trigger: MatAutocompleteTrigger): void {
  const target = event.target;
  if (target) {
    const inputElement = target as HTMLInputElement;
    this.triggerAutocomplete(field, inputElement);
   
    if (field.reset) {
      this.getControl(field.reset).setValue(null);
      this.autocompleteOptions[field.reset] = [];
      this.getControl(field.reset).updateValueAndValidity();
    };

  }
}

} 