const COLORES = ['#ff5353', '#ff7700', '#ffcd05', '#3ee741', '#58abff', '#ad60ff', '#ff79c3', '#FFFBF2'];

class Transaccion {
    static hoyInput() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    static async nuevaCategoria() {
        const res = await Interfaz.abrirModal('Nueva Categoría', `
            <label class="font-bold">Nombre</label>
            <input name="nombre" type="text" class="nb-input" required>
            <label class="font-bold mt-2">Anotación (Máx 100 char)</label>
            <input name="nota" type="text" maxlength="100" class="nb-input">
        `);
        if (res) {
            window.db.categorias.push({
                id: Date.now().toString(),
                nombre: res.nombre,
                nota: res.nota,
                moneda: window.estado.monedaActividad,
                abierta: true
            });
            window.actualizarTodo();
        }
    }

    static toggleCategoria(id) {
        const cat = window.db.categorias.find(c => c.id === id);
        if (cat) {
            cat.abierta = !cat.abierta;
            window.actualizarTodo();
        }
    }

    static async borrarCategoria(id) {
        const res = await Interfaz.abrirModal(
            '⚠️ Eliminar Categoría',
            `<div class="nb-sm bg-accent text-black rounded-lg p-4"><p class="font-bold">¿Estás seguro de que deseas eliminar esta categoría?</p><p class="text-sm mt-2">También se eliminarán todos los movimientos que contiene. Esta acción no se puede deshacer.</p></div>`,
            false, 'Eliminar', 'bg-red-400 hover:bg-red-500', 'bg-accent', 'bg-accent'
        );
        if (res) {
            window.db.categorias = window.db.categorias.filter(c => c.id !== id);
            window.db.transacciones = window.db.transacciones.filter(t => t.categoriaId !== id);
            window.actualizarTodo();
        }
    }

    static async agregar(categoriaId) {
        const cat = window.db.categorias.find(c => c.id === categoriaId);
        const res = await Interfaz.abrirModal(`Gasto en ${cat.nombre}`, `
            <input name="descripcion" type="text" placeholder="Descripción (Ej. Netflix)" class="nb-input mb-2" required>
            <input name="monto" type="number" step="0.01" min="1" placeholder="Monto" class="nb-input mb-2" required>
            <select name="tipo" class="nb-input mb-2">
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
            </select>
            <label class="font-bold text-sm block mt-2">Fecha de Pago</label>
            <input name="fecha" type="date" class="nb-input mb-2" value="${this.hoyInput()}" required>
            <label class="font-bold text-sm block mt-2 text-red-600">Fecha Vencimiento (Para Alertas)</label>
            <input name="vencimiento" type="date" class="nb-input mb-2">
            <textarea name="anotacion" maxlength="300" placeholder="Anotación (Máx 300)..." class="nb-input h-20 resize-none mt-2"></textarea>
        `);
        if (res) {
            window.db.transacciones.push({
                id: Date.now().toString(),
                categoriaId: categoriaId,
                moneda: cat.moneda,
                descripcion: res.descripcion,
                monto: parseFloat(res.monto),
                tipo: res.tipo,
                fecha: res.fecha,
                vencimiento: res.vencimiento,
                anotacion: res.anotacion,
                color: res.tipo === 'ingreso' ? '#86EFAC' : '#FCA5A5'
            });
            window.actualizarTodo();
        }
    }

    static borrar(id) {
        window.db.transacciones = window.db.transacciones.filter(t => t.id !== id);
        window.actualizarTodo();
    }

    static async editar(id) {
        const t = window.db.transacciones.find(tx => tx.id === id);
        const res = await Interfaz.abrirModal('Editar Gasto', `
            <input name="descripcion" type="text" value="${t.descripcion}" class="nb-input mb-2" required>
            <input name="monto" type="number" step="0.01" min="1" value="${t.monto}" class="nb-input mb-2" required>
            <label class="font-bold text-sm block mt-2">Fecha de Pago</label>
            <input name="fecha" type="date" class="nb-input mb-2" value="${t.fecha}" required>
            <label class="font-bold text-sm block mt-2 text-red-600">Fecha Vencimiento (Para Alertas)</label>
            <input name="vencimiento" type="date" class="nb-input mb-2" value="${t.vencimiento || ''}">
        `);
        if (res) {
            t.descripcion = res.descripcion;
            t.monto = parseFloat(res.monto);
            t.fecha = res.fecha;
            t.vencimiento = res.vencimiento;
            window.actualizarTodo();
        }
    }

    static async cambiarColor(id) {
        const t = window.db.transacciones.find(tx => tx.id === id);
        const inputsColor = COLORES.map(c => `
            <label class="cursor-pointer">
                <input type="radio" name="color" value="${c}" class="hidden" ${t.color === c ? 'checked' : ''}>
                <span class="swatch" style="background-color: ${c};"></span>
            </label>
        `).join('');
        const res = await Interfaz.abrirModal('Elige el color', `
            <div class="flex gap-2 flex-wrap justify-center py-4">${inputsColor}</div>
        `);
        if (res && res.color) {
            t.color = res.color;
            window.actualizarTodo();
        }
    }
}
