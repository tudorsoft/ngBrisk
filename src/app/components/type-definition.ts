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
    autocomplete?: boolean;
  }