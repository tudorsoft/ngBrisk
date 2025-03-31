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
  }