class GestorAlmacenamiento {
    static CLAVE = 'hackaton-finanzas-db';
    static cargar() {
        const defaultData = { monedas: ['ARS', 'USD'], categorias: [], transacciones: [] };
        try { return JSON.parse(localStorage.getItem(this.CLAVE)) || defaultData; } 
        catch (e) { return defaultData; }
    }
    static guardar(data) { localStorage.setItem(this.CLAVE, JSON.stringify(data)); }
}
