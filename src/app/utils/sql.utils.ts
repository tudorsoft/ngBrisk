export function getSqlString(sql: string = '', inputValue: string): string {
  const escapedValue = inputValue.replace(/'/g, "''");

  switch (sql) {
    case 'facturi.firme':
      return  encodeURIComponent(`select den_firma from facturi.firme where id_plsoc=2`); // and den_firma like '%${escapedValue}%'
    default:
      return '';
  }
}