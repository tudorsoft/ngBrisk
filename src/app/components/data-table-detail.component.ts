//data-table-detail.component.ts:
//------------------------------
import { Component, Input, Output, OnInit, AfterViewChecked, EventEmitter, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, startWith, switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { SectionDefinition, FieldDefinition } from './type-definition';
import { StorageService } from '../services/storage.service';
import { HttpProxyService } from '../services/http-proxy.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { getSqlString } from '../utils/sql.utils';

@Component({
  selector: 'app-data-table-detail',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule], 
  templateUrl: './data-table-detail.component.html',
  styleUrls: ['./data-table-detail.component.scss'], 
})
export class DataTableDetailComponent {
  @Input() sections: SectionDefinition[] = [];
  @Input() currentRecordDetail: any[] = [];
  @Input() fieldValues: { [key: string]: any } = {};
  @Output() detailRequested = new EventEmitter<any>();
  @Output() closeDetail: EventEmitter<void> = new EventEmitter<void>();

  detailMode: boolean = false;
  activeSection: SectionDefinition | null = null;
  currentRecord: any = null;

  autocompleteControls: { [fieldName: string]: FormControl } = {};
  autocompleteOptions: { [fieldName: string]: Observable<string[]> } = {};

  constructor(
    private storageService: StorageService,
    private httpProxyService: HttpProxyService,
    private cd: ChangeDetectorRef
    
  ) { }

  ngOnInit(): void {

  }


  selectSection(section: SectionDefinition): void {
    this.activeSection = section;
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
      //return this.currentRecordDetail.filter((record: { name: string }) => record.name === section.name);
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
    }
  
    this.cd.detectChanges();

  }

} 