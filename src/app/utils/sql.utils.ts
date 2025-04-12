//sql.utils.ts:
//------------
export function getSqlString(sql: string = '', inputValue: string): string {
  const escapedValue = inputValue.replace(/'/g, "''");

  switch (sql) {
    case 'facturi.firme':
      return encodeURIComponent(`select den_firma from facturi.firme where id_plsoc=2 and den_firma like '%${escapedValue}%'`); // and den_firma like '%${escapedValue}%'

    case 'facturi.firme_pl':
      return encodeURIComponent(`select den_plfrm from facturi.firme_pl where den_plfrm like '%${escapedValue}%'`); // and den_plfrm like '%${escapedValue}%'
    default:
      return '';
  }
}