class Moneda {
    static formatear(monto, moneda) {
        try { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(monto); }
        catch (e) { return `${moneda} ${monto.toFixed(2)}`; }
    }

    static async nuevaMoneda() {
        const res = await Interfaz.abrirModal('Agregar Moneda', `
            <label class="font-bold">Código de Moneda (Ej. EUR, BRL)</label>
            <input name="codigo" type="text" maxlength="3" class="nb-input uppercase" required>
        `);
        if (res && res.codigo && !window.db.monedas.includes(res.codigo.toUpperCase())) {
            window.db.monedas.push(res.codigo.toUpperCase());
            window.estado.monedaActividad = res.codigo.toUpperCase();
            window.actualizarTodo();
        }
    }

    static eliminarMoneda(id) {
        if (window.db.monedas.length <= 1) {
            alert('No puedes eliminar la única moneda disponible.');
            return;
        }
        window.db.monedas = window.db.monedas.filter(m => m !== id);
        window.db.categorias = window.db.categorias.filter(c => c.moneda !== id);
        window.db.transacciones = window.db.transacciones.filter(t => t.moneda !== id);
        if (window.estado.monedaInicio === id) window.estado.monedaInicio = window.db.monedas[0];
        if (window.estado.monedaActividad === id) window.estado.monedaActividad = window.db.monedas[0];
    }
}
