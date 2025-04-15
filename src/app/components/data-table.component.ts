//data-table.component.ts:
//-----------------------
import { Component, Input, OnInit, ViewChild, Output, EventEmitter, ChangeDetectorRef, SimpleChanges, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ColumnDefinition } from './type-definition'; 
import { DataTableDetailComponent } from './data-table-detail.component';

@Component({
  selector: 'app-data-table',
  //standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnInit {
    @Input() title: string = '';
    private _filteredData: any[] = []; // Variabilă privată pentru datele filtrate
    @Input() set filteredData(data: any[]) {
      this._filteredData = data; // Salvează datele filtrate
      this.originalData = data; // Salvează datele originale
      this.filterData(); // Aplică filtrul imediat
    }
    get filteredData(): any[] {
      return this._filteredData; // Returnează datele filtrate
    }
    @Input() columns: ColumnDefinition[] = [];
    @Input() columnLabels: string[] = [];
    @Input() recordCount: number = 0;
    @Output() refresh = new EventEmitter<void>();
    @Output() resetFilters = new EventEmitter<void>(); // Eveniment pentru resetarea filtrelor

    @Input() filterFields: any[] = []; // Câmpurile de filtrare
    filters: FormGroup = new FormGroup({});
    @Output() filterChange = new EventEmitter<any>(); // Emitem valorile câmpurilor de filtrare
    @Output() filterDatabaseChange = new EventEmitter<any[]>(); // Emitem filterDatabase către componentele apelatoare
    @Output() formReady = new EventEmitter<FormGroup>();

    //@Output() recordDblClick = new EventEmitter<any>();
    @Output() detailRequired: EventEmitter<{ record: any, editMode: boolean }> = new EventEmitter();


    searchValues: string[] = [];
    selectedColumns: string[] = [];
    
    originalData: any[] = []; // Copie a datelor originale
    filterValues: any = {}; // Obiect pentru a stoca valorile câmpurilor de filtrare
    filterDatabase: any[] = []; // Obiect pentru a stoca filtrele în format { name, value }
    
    public selectedRecord: any = null; 
    public isDetailVisible: boolean = false;
    public filterFormSubject  = new BehaviorSubject<FormGroup>(new FormGroup({}));
    filterForm$ = this.filterFormSubject.asObservable();

    @ViewChild(DataTableDetailComponent)
    private dataTableDetail!: DataTableDetailComponent;

    @ViewChild('tableContainer') tableContainer!: ElementRef;
    showScrollToTop: boolean = false;
    private scrollThreshold: number = window.innerHeight;
    scrollToTop(): void {
      this.tableContainer.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onTableContainerScroll(event: any): void {
      const scrollPosition = event.target.scrollTop;
      this.showScrollToTop = scrollPosition > this.scrollThreshold;
    }

    constructor(
      private fb: FormBuilder, 
      private cd: ChangeDetectorRef) {}

    toolTipText(textContent: string): string {
      return textContent.replace(/\\r\\n/g, '\n');

    }


    // Adăugăm variabilele pentru sortare
    sortColumn: string = ''; 
    sortDirection: 'asc' | 'desc' = 'asc'; 
    
    ngOnInit() {
        
        console.log('ngOnInit - filterFields:', this.filterFields); // Debug
        if (!this.filterFields) {
            console.error('filterFields is not defined');
            return;
        }

        const form = this.fb.group({}); // Inițializează formularul
        this.filterFields.forEach((field) => {
            form.addControl(field.name, this.fb.control('')); // Adaugă controale pentru fiecare câmp de filtrare
        });

        this.filterFormSubject.next(form); // Emite formularul către BehaviorSubject

        this.searchValues = Array(this.columns.length).fill('');
        this.selectedColumns = this.columns.map(col => col.name);

        this.initializeFilterFields();
    }
  
    ngOnChanges(changes: SimpleChanges) {
        console.log('ngOnChanges - filterFields:', this.filterFields); // Debug
        if (changes['filterFields'] && this.filterFields) {
            const form = this.fb.group({}); // Inițializează formularul
            this.filterFields.forEach((field) => {
                form.addControl(field.name, this.fb.control('')); // Adaugă controale pentru fiecare câmp de filtrare
            });

            this.filterFormSubject.next(form); // Emite formularul către BehaviorSubject
        }
    }
    
    private initializeFilterFields(): void {
        const group: { [key: string]: FormControl } = {};
      
        this.filterFields.forEach(field => {
          group[field.name] = new FormControl(field.defaultValue ?? '');
        });
      
        const form = new FormGroup(group);
        this.filterFormSubject.next(form);
        
        this.formReady.emit(form); // ✅ Emitere către componenta părinte
      }

    toggleColumn(column: string) {
      const index = this.selectedColumns.indexOf(column);
      if (index > -1) {
        this.selectedColumns.splice(index, 1);
      } else {
        this.selectedColumns.push(column);
      }
      this.filterData();
    }

    getSearchValue(columnName: string): string {
        const index = this.columns.findIndex(c => c.name === columnName);
        return index !== -1 ? this.searchValues[index] : ''; // Safely access search values
    }
    
    // Optional: Method to set the search value based on the column name
    setSearchValue(columnName: string, value: string) {
        const index = this.columns.findIndex(c => c.name === columnName);
        if (index !== -1) {
            this.searchValues[index] = value; // Update the corresponding search value
        }
    }

    filterData() {
        if (!this.originalData) return; // Verifică dacă există date originale
    
        // Filtrează datele pe baza valorilor din searchValues
        this._filteredData = this.originalData.filter(item => {
          return this.columns.every((column, index) => {
            const searchValue = this.searchValues[index]?.toLowerCase() ?? ''; // Safe access
            return item[column.name]?.toString().toLowerCase().includes(searchValue) || !this.selectedColumns.includes(column.name);
          });
        });
    
        this.applySorting(); // Aplică sortarea după filtrare
        this.cd.detectChanges(); // Forțează detectarea schimbărilor
    }

    applySorting() {
        if (this.sortColumn) {
            this.filteredData.sort((a, b) => {
                const aValue = a[this.sortColumn];
                const bValue = b[this.sortColumn];
    
                if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
    }

    sortData(columnName: string) {
        if (this.sortColumn === columnName) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; // Inversăm direcția
        } else {
          this.sortColumn = columnName;
          this.sortDirection = 'asc';
        }
        this.filterData();
    }

  // Returnează definiția completă a unei coloane pe baza numelui
  getColumnDefinition(columnName: string): ColumnDefinition | undefined {
    return this.columns.find(c => c.name === columnName);
  }

  // Determină dacă o coloană este numerică
  isNumericColumn(column: ColumnDefinition): boolean {
    return column.type === 'numeric';
  }

  // Determină dacă checkbox-ul trebuie bifat (pentru coloanele de tip "check")
  isChecked(item: any, column: ColumnDefinition): boolean {
    const value = item[column.name];
    return value === 1 || value === '1';
  }

  // Returnează lățimea definită a coloanei sau 'auto' dacă nu este specificată
  getColumnWidth(column: ColumnDefinition): string {
    return column.width ? column.width : 'auto';
  }

  // Returnează clasa de aliniere în funcție de proprietatea 'align' a coloanei
  getAlignmentClass(column: ColumnDefinition): string {
    if (column.align) {
      if (column.align === 'right') {
        return 'text-right';
      } else if (column.align === 'center') {
        return 'text-center';
      } else {
        return 'text-left';
      }
    }
    return this.isNumericColumn(column) ? 'text-right' : 'text-left';
  }

  getColumnColor(colName: string, value: any): string {
    const colDef = this.columns.find(col => col.name === colName);
    if (colDef && colDef.colorMapping) {
      return colDef.colorMapping(value);
    }
    return '';
  }
  
  hasColorMapping(colName: string): boolean {
    const colDef = this.columns.find(col => col.name === colName);
    return !!(colDef && colDef.colorMapping);
  }

  getColumnPicture(colName: string, value: any): string {
    const colDef = this.columns.find(col => col.name === colName);
    if (colDef && colDef.pictureMapping) {
      return colDef.pictureMapping(value);
    }
    return '';
  }
  
  hasPictureMapping(colName: string): boolean {
    const colDef = this.columns.find(col => col.name === colName);
    return !!(colDef && colDef.pictureMapping);
  }

  // Exemplu de formatare a numerelor; poți adapta implementarea după necesități
  formatNumber(value: any, column: ColumnDefinition): string {
    if (value == null) return '';
    let decimals = column.decimals || 0;
    return Number(value).toFixed(decimals);
  }

  calculateTotal(column: string): string {
      const decimalPlaces = this.columns.find(c => c.name === column)?.decimals || 0;
      const total = this.filteredData.reduce((acc, item) => {
          const value = item[column];
          return typeof value === 'number' ? acc + value : acc;
      }, 0);
      return total.toFixed(decimalPlaces);
  }

  showTotals(): boolean {
      return this.filteredData.length > 0;
  }

  canShowTotal(column: ColumnDefinition): boolean {
      const col = this.columns.find(c => c.name === column.name);
      return col ? col.showTotal === true : false; // Check if the column allows total display
  }
  
  onRefresh() {
      const filterForm = this.filterFormSubject.value; // Accesează valoarea curentă a filterForm
      if (!filterForm) {
          console.error('filterForm is not initialized');
          return;
      }
  
      const filterDatabase = this.filterFields.map((field) => {
          return {
              name: field.name,
              value: filterForm.get(field.name)?.value || '', // Folosește filterForm
          };
      });
      this.filterDatabaseChange.emit(filterDatabase); // Emite filterDatabase către componentele părinte
  }

  onFilterChange(fieldName: string, value: any) {
  this.filterValues[fieldName] = value; // Actualizează valoarea filtrului
  this.filterChange.emit(this.filterValues); // Emite noile valori ale filtrelor
  }

  onResetFilters() {
  const filterForm = this.filterFormSubject.value; // Accesează valoarea curentă a filterForm
  if (!filterForm) {
      console.error('filterForm is not initialized');
      return;
  }

  filterForm.reset(); // Resetează formularul
  this.onRefresh(); // Aplică filtrele goale
  }

  buildFilterDatabase() {
  this.filterDatabase = this.filterFields.map((field) => {
      return {
      name: field.name,
      value: this.filterValues[field.name] || '', // Folosim valoarea din filterValues sau o valoare implicită
      };
  });
  this.filterDatabaseChange.emit(this.filterDatabase); // Emitem filterDatabase către componentele apelatoare
  }
  
  // Funcția care apelează buildFilterDatabase și emite evenimentul
  applyFilters() {
  this.buildFilterDatabase(); // Construiește filterDatabase
  this.filterDatabaseChange.emit(this.filterDatabase); // Emite filterDatabase către componentele părinte
  }

  onRowClick(record: any): void {
    this.selectedRecord = record;
  }
  
  onRowDblClick(record: any): void {
    //console.log('Dublu-click pe record:', record);
    //this.recordDblClick.emit(record);
    this.detailRequired.emit({ record: record, editMode: true });
    
  }

  // Pentru butonul "Modifică":
onModify(): void {
  if (this.selectedRecord) {
    this.detailRequired.emit({ record: this.selectedRecord, editMode: true });
  } else {
    alert('Selectați o înregistrare pentru modificare.');
  }
}

// Pentru butonul "Adaugă":
onAdd(): void {
  const emptyRecord: any = {};
  this.columns.forEach((col: ColumnDefinition) => {
    emptyRecord[col.name] = ''; // Creează un obiect cu câmpuri goale
  });
  this.detailRequired.emit({ record: emptyRecord, editMode: false });
}

  onDelete(): void {
    if (this.selectedRecord) {
      if (confirm('Sigur doriți să ștergeți această înregistrare?')) {
        this.deleteRecord(this.selectedRecord);
        this.selectedRecord = null;
      }
    } else {
      alert('Selectați o înregistrare pentru ștergere.');
    }
  }

  deleteRecord(record: any): void {
    console.log('Ștergere record:', record);
    // Integrează aici logica de ștergere, eventual comunicare cu backend-ul sau actualizarea listei locale
  }

}