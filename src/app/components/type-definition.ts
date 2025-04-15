//type-definition.ts:
//------------------
export interface ColumnDefinition {
    label: string;
    name: string;
    type: string;
    showTotal?: boolean;
    decimals?: number;
    width?: string;
    align?: string;
    fixed?: string;
    placeholder?: string;
    colorMapping?: (value: any) => string;
    pictureMapping?: (value: any) => string;
  }

  export interface SectionDefinition {
    label: string;
    name: string;
    fields?: FieldDefinition[];
    displayAsTable?: boolean;
    required?: number;
  }

  export interface FieldDefinition {
    label: string;      // Textul etichetei câmpului
    name: string;       // Numele câmpului (folosit pentru a prelua valoarea din currentRecordDetail)
    type: string;       // Tipul câmpului (ex: 'text', 'date', 'numeric', 'combo')
    values?: string[];  // (Opțional) Lista de valori pentru câmpurile de tip combo
    align?: string;
    group?: string;
    sql?: string;
    width?: string;
    placeholder?: string;
    autocomplete?: boolean;
    dependency?: FieldDependency;
    reset?: string;
  }

export interface FieldDependency {
  fieldName: string; // Numele câmpului de la care depinde (ex.: "den_firma")
  sql: string;    // Proprietatea din valoarea câmpului de la care depinde (ex.: "id_firma")
  sqlval: string;  
}



import { MatDateFormats } from '@angular/material/core';
export const MY_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'DD-MM-YYYY',
  },
  display: {
    dateInput: 'DD-MM-YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};