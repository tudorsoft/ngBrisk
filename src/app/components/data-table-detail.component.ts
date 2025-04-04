//data-table-detail.component.ts:
//------------------------------
import { Component, Input, Output, OnInit, AfterViewChecked, EventEmitter, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { SectionDefinition } from './type-definition';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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


}
