//environment.ts:
//--------------
export const environment = {
    production: false,
    cDatabaseUrlLocal: 'http://192.168.2.195:8070',
    cDatabaseUrlExternal: 'http://62.217.234.102:8070',
    //cDatabaseUrlLocal:    'http://localhost:8777',
    //cDatabaseUrlExternal: 'http://95.77.234.46:8777'
    useProxy: window.location.hostname.indexOf('localhost') !== -1 ? false : true,
};