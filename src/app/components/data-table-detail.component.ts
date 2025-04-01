import { Component, Input } from '@angular/core';
import { SectionDefinition } from './type-definition';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data-table-detail',
  imports: [CommonModule], 
  templateUrl: './data-table-detail.component.html',
  styleUrls: ['./data-table-detail.component.scss'] 
})
export class DataTableDetailComponent {
  @Input() sections: SectionDefinition[] = [];
  detailMode: boolean = false;
  activeSection: SectionDefinition | null = null;

  // Apelată la dublu-click pe o înregistrare din listă
  openDetail() {
    this.detailMode = true;
    if (this.sections && this.sections.length) {
      this.activeSection = this.sections[0];
    }
  }

  backToList() {
    this.detailMode = false;
  }

  selectSection(section: SectionDefinition) {
    this.activeSection = section;
  }
}
