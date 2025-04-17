//data-table-detail.component.ts:
//------------------------------
import { Component, Input, Output, OnInit, AfterViewChecked, EventEmitter, ChangeDetectorRef, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, startWith, switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators  } from '@angular/forms';
import { SectionDefinition, FieldDefinition, TabDefinition, MY_DATE_FORMATS } from './type-definition';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatNativeDateModule } from '@angular/material/core';
import { FieldRendererComponent } from './field-renderer.component';

@Component({
  selector: 'app-data-table-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatCheckboxModule, MatTabsModule, 
    MatDatepickerModule, MatNativeDateModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, 
    FieldRendererComponent], 
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
  pageTableColumns:  { [sectionName: string]: FieldDefinition[] } = {};
  pageFrameTabs: { [sectionName: string]: TabDefinition[] } = {};

  constructor(
    private storageService: StorageService,
    private httpProxyService: HttpProxyService,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder
  ) { }

trackByTabName(index: number, tab: TabDefinition): string {
  return tab.name;
}
trackByGroupIndex(index: number, group: FieldDefinition[]): number {
  return index;
}
trackByFieldName(index: number, field: FieldDefinition): string {
  return field.name;
}

ngOnInit(): void {
  const group: { [key: string]: FormControl } = {};  // Inițializare dinamică a formularului, pe baza secțiunilor și câmpurilor
  this.sections.forEach(section => {
    section.fields?.forEach(field => {
      // Se poate aplica logica de validare specifică fiecărui tip
      group[field.name] = this.fb.control('', Validators.required);
    });
  });
  this.formGroup = this.fb.group(group);
  this.sectionsTableColumns();
  this.sectionsPageFrameTabs();
}

sectionsTableColumns(): void {
  // Iterează prin secțiuni și selectează pe cele care au displayAs "table"
  this.pageTableColumns = {};
  this.sections.forEach(section => {
    if (section.displayAs === 'table' && section.fields && section.fields.length) {
      const columns: { [key: string]: FieldDefinition } = {};
      section.fields.forEach(field => {
        if (field.colOrder ) {
          const key = field.name;
          if (!columns[key]) {
            columns[key] = { 
                label:        field.label,
                name:         field.name,
                type:         field.type,
                values:       field?.values,
                align:        field?.align,
                group:        field?.group,
                sql:          field?.sql,
                width:        field?.width,
                icon:         field?.icon,
                placeholder:  field?.placeholder,
                autocomplete: field?.autocomplete,
                dependency:   field?.dependency,
                reset:        field?.reset,
                colOrder:     field?.colOrder
             } as FieldDefinition;
          }

        }
      });
      this.pageTableColumns[section.name] = Object.keys(columns).map(key => columns[key]);
    }
  });
}

sectionsPageFrameTabs(): void {
  this.pageFrameTabs = {};
  this.sections.forEach(section => {
    if (section.displayAs === 'pageframe' && section.fields) {
      const tabs: { [key: string]: TabDefinition } = {};

      section.fields.forEach(field => {
        if (field.type === 'tab') {
          const key = field.name;
          // Inițializez TabDefinition cu array‑ul de sub‑câmpuri direct din field.fields
          tabs[key] = {
            label: field.label,
            name:  field.name,
            icon:  field.icon,
            // folosește direct sub‑câmpurile, sau [] dacă nu există
            fields: field.fields ?? []
          };
        }
      });

      this.pageFrameTabs[section.name] = Object.values(tabs);
    }
  });
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
  // presupunem că this.currentRecordDetail[0] este obiectul principal
  const rec = this.currentRecordDetail && this.currentRecordDetail[0];
  if (!rec) {
    return [];
  }
  // dacă secțiunea e tabelară, rec[section.name] ar trebui să fie un array de rânduri
  const rows = rec[section.name];
  return Array.isArray(rows) ? rows : [];
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

} 