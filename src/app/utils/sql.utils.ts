//sql.utils.ts:
//------------
export function getSqlString(sql: string = '', inputValue: string, sqlDep: string = ''): string {
  const escapedValue = inputValue.replace(/'/g, "''");

  switch (sql) {
    case 'facturi.firme':
      return encodeURIComponent(`select id_firma, den_firma from facturi.firme where id_plsoc=2 and blocat=0 and (den_firma like '%${escapedValue}%' or cod_firma like '%${escapedValue}%') order by firme.den_firma`); // and den_firma like '%${escapedValue}%'

    case 'facturi.firme_pl':
      return encodeURIComponent(`select id_firma, id_plfrm, den_plfrm from facturi.firme_pl where `+(sqlDep != '' ? sqlDep+' and ' : '')+`blocat=0 and den_plfrm like '%${escapedValue}%' order by firme_pl.den_plfrm`);

    case 'service.comenzicateg':
      return encodeURIComponent(`select id_comcat, den_comcat+' '+trim(obs) as den_comcat from service.comenzicateg where blocat=0 and (den_comcat like '%${escapedValue}%' or cod_comcat like '%${escapedValue}%') order by comenzicateg.den_comcat` );
    default:
      return '';
  }
}