window.db = GestorAlmacenamiento.cargar();
window.estado = { ventanaActual: 'inicio', monedaInicio: 'ARS', monedaActividad: 'ARS', periodo: 'semanal' };
window.alertasActuales = [];

window.actualizarTodo = function() {
    GestorAlmacenamiento.guardar(window.db);
    Interfaz.renderInicio();
    Interfaz.renderActividad();
    Interfaz.revisarNotificaciones();
};

document.addEventListener('DOMContentLoaded', () => {
    window.actualizarTodo();
    Interfaz.cambiarVentana('inicio');

    document.querySelectorAll('[data-abrir]').forEach(btn => {
        btn.addEventListener('click', e => Interfaz.cambiarVentana(e.target.dataset.abrir));
    });

    document.getElementById('btn-notificaciones').addEventListener('click', () => {
        if (window.alertasActuales.length === 0) {
            Interfaz.abrirModal('Notificaciones', '<p class="font-bold py-4">No hay vencimientos en las próximas 24 horas.</p>', true);
            return;
        }
        let htmlLista = '<div class="space-y-3 mt-2 max-h-60 overflow-y-auto">';
        window.alertasActuales.forEach(t => {
            htmlLista += `
                <div class="nb-sm bg-red-100 p-3 rounded border-2 border-red-500 text-black">
                    <p class="font-black text-lg">${t.descripcion}</p>
                    <p class="font-bold">Vence: ${t.vencimiento} - ${Moneda.formatear(t.monto, t.moneda)}</p>
                </div>
            `;
        });
        Interfaz.abrirModal('⚠️ Vencen en 24hs', htmlLista + '</div>', true);
    });

    document.body.addEventListener('click', e => {
        const btnPeriodo = e.target.closest('[data-periodo]');
        if (btnPeriodo) {
            window.estado.periodo = btnPeriodo.dataset.periodo;
            Interfaz.renderInicio();
            return;
        }

        const btn = e.target.closest('[data-accion]');
        if (!btn) return;

        const accion = btn.dataset.accion;
        const id = btn.dataset.id;

        if (accion === 'cambiar-moneda') {
            if (btn.dataset.ctx === 'inicio-monedas') window.estado.monedaInicio = btn.dataset.moneda;
            if (btn.dataset.ctx === 'tabs-monedas') window.estado.monedaActividad = btn.dataset.moneda;
            window.actualizarTodo();
        }
        if (accion === 'nueva-moneda') Moneda.nuevaMoneda();
        if (accion === 'nueva-categoria') Transaccion.nuevaCategoria();
        if (accion === 'toggle-cat') Transaccion.toggleCategoria(id);
        if (accion === 'borrar-cat') Transaccion.borrarCategoria(id);
        if (accion === 'agregar-tx') Transaccion.agregar(id);
        if (accion === 'borrar-tx') Transaccion.borrar(id);
        if (accion === 'editar-tx') Transaccion.editar(id);
        if (accion === 'color-tx') Transaccion.cambiarColor(id);
    });

    const btnTema = document.getElementById('btn-tema');
    const iconoTema = btnTema.querySelector('img');
    btnTema.addEventListener('click', () => {
        iconoTema.src = document.documentElement.classList.toggle('dark') ? 'assets/sol_icon.png' : 'assets/luna_icon.png';
    });
});

const papelera = document.getElementById('papelera');

document.addEventListener('dragstart', e => {
    const el = e.target.closest('.elemento-arrastrable');
    if (el) {
        Interfaz.itemArrastrado = { id: el.dataset.id, tipo: el.dataset.tipo };
        el.classList.add('arrastrando');
        papelera.classList.remove('hidden');
    }
});

document.addEventListener('dragend', e => {
    const el = e.target.closest('.elemento-arrastrable');
    if (el) el.classList.remove('arrastrando');
    Interfaz.ocultarPapelera();
    Interfaz.itemArrastrado = null;
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') Interfaz.ocultarPapelera();
});

document.addEventListener('dragover', e => {
    if (!Interfaz.itemArrastrado) return;
    const destinoTx = e.target.closest('li[data-tipo="tx"]');
    const destinoCat = e.target.closest('article[data-tipo="cat"]');
    Interfaz.limpiarIndicadoresCategorias();

    if (Interfaz.itemArrastrado.tipo === 'cat') {
        if (!destinoCat || destinoCat.dataset.id === Interfaz.itemArrastrado.id) return;
        const origen = window.db.categorias.find(c => c.id === Interfaz.itemArrastrado.id);
        const destino = window.db.categorias.find(c => c.id === destinoCat.dataset.id);
        if (!origen || !destino || origen.moneda !== destino.moneda) return;
        e.preventDefault();
        destinoCat.classList.add('categoria-destino');
        return;
    }

    if (Interfaz.itemArrastrado.tipo === 'tx') {
        const origen = window.db.transacciones.find(t => t.id === Interfaz.itemArrastrado.id);
        if (!origen) return;
        if (destinoTx && destinoTx.dataset.id !== Interfaz.itemArrastrado.id) {
            const destino = window.db.transacciones.find(t => t.id === destinoTx.dataset.id);
            if (destino && destino.moneda === origen.moneda) {
                e.preventDefault();
                destinoTx.classList.add('categoria-destino');
                return;
            }
        }
        if (destinoCat) {
            const categoria = window.db.categorias.find(c => c.id === destinoCat.dataset.id);
            if (categoria && categoria.moneda === origen.moneda) {
                e.preventDefault();
                destinoCat.classList.add('categoria-destino');
            }
        }
    }
});

document.addEventListener('drop', e => {
    if (!Interfaz.itemArrastrado) return;
    const destinoTx = e.target.closest('li[data-tipo="tx"]');
    const destinoCat = e.target.closest('article[data-tipo="cat"]');
    Interfaz.limpiarIndicadoresCategorias();

    if (Interfaz.itemArrastrado.tipo === 'cat') {
        if (!destinoCat) return;
        const idOrigen = Interfaz.itemArrastrado.id;
        const idDestino = destinoCat.dataset.id;
        if (idOrigen === idDestino) return;

        const catOrigen = window.db.categorias.find(c => c.id === idOrigen);
        const catDestino = window.db.categorias.find(c => c.id === idDestino);
        if (!catOrigen || !catDestino || catOrigen.moneda !== catDestino.moneda) return;

        e.preventDefault();
        const rect = destinoCat.getBoundingClientRect();
        const insertarAntes = e.clientY < rect.top + rect.height / 2;

        window.db.categorias = window.db.categorias.filter(c => c.id !== idOrigen);
        const nuevoIndice = window.db.categorias.findIndex(c => c.id === idDestino);
        if (nuevoIndice === -1) return;

        window.db.categorias.splice(insertarAntes ? nuevoIndice : nuevoIndice + 1, 0, catOrigen);
        window.actualizarTodo();
        Interfaz.ocultarPapelera();
        Interfaz.itemArrastrado = null;
        return;
    }

    if (Interfaz.itemArrastrado.tipo === 'tx') {
        const idOrigen = Interfaz.itemArrastrado.id;
        const mov = window.db.transacciones.find(t => t.id === idOrigen);
        if (!mov) return;

        if (destinoTx && destinoTx.dataset.id !== idOrigen) {
            const destino = window.db.transacciones.find(t => t.id === destinoTx.dataset.id);
            if (!destino || destino.moneda !== mov.moneda) return;
            e.preventDefault();

            mov.categoriaId = destino.categoriaId;
            const rect = destinoTx.getBoundingClientRect();
            const insertarAntes = e.clientY < rect.top + rect.height / 2;

            window.db.transacciones = window.db.transacciones.filter(t => t.id !== idOrigen);
            const nuevoIndice = window.db.transacciones.findIndex(t => t.id === destino.id);
            if (nuevoIndice === -1) return;

            window.db.transacciones.splice(insertarAntes ? nuevoIndice : nuevoIndice + 1, 0, mov);
            window.actualizarTodo();
            Interfaz.ocultarPapelera();
            Interfaz.itemArrastrado = null;
            return;
        }

        if (destinoCat) {
            const nuevaCat = window.db.categorias.find(c => c.id === destinoCat.dataset.id);
            if (!nuevaCat || nuevaCat.moneda !== mov.moneda) return;
            e.preventDefault();

            mov.categoriaId = nuevaCat.id;
            window.db.transacciones = window.db.transacciones.filter(t => t.id !== idOrigen);

            const movsDestino = window.db.transacciones
                .map((t, i) => ({ mov: t, indice: i }))
                .filter(item => item.mov.categoriaId === nuevaCat.id);

            if (movsDestino.length > 0) {
                const ultimo = movsDestino[movsDestino.length - 1];
                window.db.transacciones.splice(ultimo.indice + 1, 0, mov);
            } else {
                window.db.transacciones.push(mov);
            }
            window.actualizarTodo();
            Interfaz.ocultarPapelera();
            Interfaz.itemArrastrado = null;
        }
    }
});

papelera.addEventListener('dragover', e => {
    e.preventDefault();
    papelera.classList.add('sobre');
});

papelera.addEventListener('dragleave', () => papelera.classList.remove('sobre'));

papelera.addEventListener('drop', e => {
    e.preventDefault();
    if (!Interfaz.itemArrastrado) return;

    if (Interfaz.itemArrastrado.tipo === 'cat') {
        window.db.categorias = window.db.categorias.filter(c => c.id !== Interfaz.itemArrastrado.id);
        window.db.transacciones = window.db.transacciones.filter(t => t.categoriaId !== Interfaz.itemArrastrado.id);
    } else if (Interfaz.itemArrastrado.tipo === 'tx') {
        window.db.transacciones = window.db.transacciones.filter(t => t.id !== Interfaz.itemArrastrado.id);
    } else if (Interfaz.itemArrastrado.tipo === 'moneda') {
        Moneda.eliminarMoneda(Interfaz.itemArrastrado.id);
    }

    window.actualizarTodo();
    Interfaz.ocultarPapelera();
});
