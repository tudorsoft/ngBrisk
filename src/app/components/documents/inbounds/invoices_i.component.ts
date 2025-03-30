//invoices_i.component.ts:
//----------------------
import { HttpClient        } from '@angular/common/http';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule      } from '@angular/common';
import { StorageService    } from '../../../services/storage.service';
import { DataTableComponent} from '../../data-table.component';

interface ColumnDefinition {
  label: string;
  name: string;
  type: string;
  showTotal?: boolean;
  decimals?: number;
  width?: string;
}

@Component({
  selector: 'app-invoices-i',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './invoices_i.component.html',
  styleUrls: ['./invoices_i.component.scss'],
})
export class InvoicesIComponent implements OnInit {
  @Output() dataUpdated = new EventEmitter<any[]>();
  filteredData: any[] = [];

  columns: ColumnDefinition[] = [
    { label: 'ID', name: 'id', type: 'numeric', width: '70px' },
    { label: 'Data', name: 'invoiceDate', type: 'date' },
    { label: 'Denumire Furnizor', name: 'supplierName', type: 'text' },
    { label: 'Valoare', name: 'amount', type: 'numeric', showTotal: true, decimals: 2 },
  ];

  selectedColumns: string[] = this.columns.map(col => col.name );
  columnLabels   : string[] = this.columns.map(col => col.label);

  constructor( public storageService: StorageService, 
               private http: HttpClient ) {}
  ngOnInit() {
    this.fetchData();
  }
  
  fetchData() {
    const apiUrl = (this.storageService.cDatabaseUrl.endsWith('/') ? this.storageService.cDatabaseUrl.slice(0, -1) : this.storageService.cDatabaseUrl);
    console.log('fetchData a fost apelat');
    if (apiUrl !== '') {
      const fullUrl = apiUrl + '/wngInvoices';
      this.http.get<any[]>(fullUrl).subscribe(response => {
        this.filteredData = [...response];
        console.log('Datele au fost preluate:', this.filteredData);
        this.dataUpdated.emit(this.filteredData);
      }, error => {
        console.error('Eroare accesare ' + fullUrl, error);
      });
    }
  }

}