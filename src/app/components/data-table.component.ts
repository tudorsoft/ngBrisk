//data-table.component.ts:
//-----------------------
import { Component, Input, OnInit, AfterViewChecked, Output, EventEmitter, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

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
    @Input() columns: { label: string; name: string; type: string; showTotal?: boolean; decimals?: number; width?: string; }[] = [];
    @Input() columnLabels: string[] = [];
    @Input() recordCount: number = 0;
    @Output() refresh = new EventEmitter<void>();
    @Output() resetFilters = new EventEmitter<void>(); // Eveniment pentru resetarea filtrelor

    @Input() filterFields: any[] = []; // Câmpurile de filtrare
    @Output() filterChange = new EventEmitter<any>(); // Emitem valorile câmpurilor de filtrare
    @Output() filterDatabaseChange = new EventEmitter<any[]>(); // Emitem filterDatabase către componentele apelatoare
  
    searchValues: string[] = [];
    selectedColumns: string[] = [];
    originalData: any[] = []; // Copie a datelor originale
    filterValues: any = {}; // Obiect pentru a stoca valorile câmpurilor de filtrare
    filterDatabase: any[] = []; // Obiect pentru a stoca filtrele în format { name, value }
    //filterForm!: FormGroup; // Marchează filterForm ca fiind asignată ulterior

    private filterFormSubject = new BehaviorSubject<FormGroup | null>(null);
    filterForm$ = this.filterFormSubject.asObservable();


    constructor(private fb: FormBuilder, private cd: ChangeDetectorRef) {}

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
        this.filterFields.forEach((field) => {
            this.filterValues[field.name] = ''; // Inițializează valorile câmpurilor de filtrare
        });
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

    isNumericColumn(column: string): boolean {
        const col = this.columns.find(c => c.name === column);
        return col ? col.type === 'numeric' : false;
    }

    formatNumber(value: any, columnName: string): string {
        const decimals = this.columns.find(c => c.name === columnName)?.decimals || 0;
        return typeof value === 'number' ? value.toFixed(decimals) : '';
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

    canShowTotal(column: string): boolean {
        const col = this.columns.find(c => c.name === column);
        return col ? col.showTotal === true : false; // Check if the column allows total display
    }
    
    getColumnWidth(columnName: string): string {
        const col = this.columns.find(c => c.name === columnName);
        return col ? col.width || 'auto' : 'auto'; // Return the width or 'auto' as default
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
}