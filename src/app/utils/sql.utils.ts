export function getSqlString(sql: string = '', inputValue: string): string {
  const escapedValue = inputValue.replace(/'/g, "''");

  switch (sql) {
    case 'facturi.firme':
      return  encodeURIComponent(`select den_firma from facturi.firme where den_firma like '%${escapedValue}%'`);
    default:
      return '';
  }
}