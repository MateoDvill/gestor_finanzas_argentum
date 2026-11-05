class Interfaz {
    static tooltipGrafico = null;
    static itemArrastrado = null;

    static cambiarVentana(nombreVentana) {
        if (nombreVentana === window.estado.ventanaActual) return;
        const orden = ['inicio', 'actividad'];
        window.estado.ventanaActual = nombreVentana;

        document.querySelectorAll('[data-abrir]').forEach(btn => {
            const activo = btn.dataset.abrir === nombreVentana;
            btn.classList.toggle('bg-accent', activo);
            btn.classList.toggle('text-neutral-900', activo);
            btn.classList.toggle('bg-card', !activo);
            btn.classList.toggle('dark:bg-card-dark', !activo);
        });

        orden.forEach((v, index) => {
            const idxActual = orden.indexOf(nombreVentana);
            const element = document.getElementById(`ventana-${v}`);
            if (element) element.style.transform = `translateX(${(index - idxActual) * 100}%)`;
        });
    }

    static abrirModal(titulo, htmlInputs, ocultarCancelar = false, textoBoton = 'Cerrar / Guardar', colorBoton = 'bg-accent', colorCancelar = 'bg-gray-200', colorFondo = '') {
        return new Promise(resolve => {
            const dialog = document.getElementById('modal');
            const form = dialog.querySelector('form');

            dialog.classList.remove('bg-card', 'dark:bg-card-dark', 'bg-accent');
            if (colorFondo) dialog.classList.add(colorFondo);
            else dialog.classList.add('bg-card', 'dark:bg-card-dark');

            form.innerHTML = `
            <h2 class="font-black text-xl mb-2">${titulo}</h2>
            ${htmlInputs}
            <div class="flex gap-2 justify-end mt-4">
                ${!ocultarCancelar ? `<button type="button" id="btn-cancelar" class="nb-btn ${colorCancelar} text-black rounded-lg px-4 py-2 font-bold">Cancelar</button>` : ''}
                <button type="submit" class="nb-btn ${colorBoton} text-black rounded-lg px-4 py-2 font-black">${textoBoton}</button>
            </div>`;

            dialog.showModal();

            form.onsubmit = (e) => {
                e.preventDefault();
                dialog.close();
                resolve(Object.fromEntries(new FormData(form)));
            };

            if (!ocultarCancelar) {
                form.querySelector('#btn-cancelar').onclick = () => {
                    dialog.close();
                    resolve(null);
                };
            }
        });
    }

    static obtenerTooltipGrafico() {
        if (!this.tooltipGrafico) {
            this.tooltipGrafico = document.createElement('div');
            this.tooltipGrafico.id = 'tooltip-grafico';
            document.body.appendChild(this.tooltipGrafico);
        }
        return this.tooltipGrafico;
    }

    static mostrarTooltipGrafico(texto, e) {
        const tooltip = this.obtenerTooltipGrafico();
        tooltip.textContent = texto;
        tooltip.style.display = 'block';

        let x = e.clientX + 12;
        let y = e.clientY - tooltip.offsetHeight - 12;

        if (x + tooltip.offsetWidth > window.innerWidth - 8) x = e.clientX - tooltip.offsetWidth - 12;
        if (y < 8) y = e.clientY + 12;
        if (y + tooltip.offsetHeight > window.innerHeight - 8) y = window.innerHeight - tooltip.offsetHeight - 8;

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    static ocultarTooltipGrafico() {
        if (this.tooltipGrafico) this.tooltipGrafico.style.display = 'none';
    }

    static dibujarGraficoCaja(contenedorId, datos, llave, claseColorBase, moneda) {
        const cont = document.getElementById(contenedorId);
        cont.innerHTML = '';

        let datosRender = datos;
        if (datos.length > 31) {
            datosRender = [];
            const tamañoGrupo = Math.ceil(datos.length / 15);
            for (let i = 0; i < datos.length; i += tamañoGrupo) {
                const chunk = datos.slice(i, i + tamañoGrupo);
                datosRender.push({ label: chunk[0].label, valor: chunk.reduce((acc, curr) => acc + curr[llave], 0) });
            }
        } else {
            datosRender = datos.map(d => ({ label: d.label, valor: d[llave] }));
        }

        const maxAbsoluto = Math.max(...datosRender.map(d => Math.abs(d.valor))) || 1;

        if (maxAbsoluto === 1 && datosRender.every(d => d.valor === 0)) {
            cont.innerHTML = '<span class="w-full text-center text-sm font-bold opacity-50 block mt-10">Sin datos</span>';
            return;
        }

        datosRender.forEach(d => {
            const barra = document.createElement('div');
            barra.className = `flex-1 min-w-[4px] ${(llave === 'balance' && d.valor < 0) ? 'bg-red-400' : claseColorBase} border-2 border-black rounded-t-sm transition-all hover:opacity-80`;
            barra.style.height = `${Math.max((Math.abs(d.valor) / maxAbsoluto) * 100, 2)}%`;
            barra.style.position = 'relative';

            const textoTooltip = `${d.label}: ${Moneda.formatear(d.valor, moneda)}`;
            barra.addEventListener('mouseenter', e => this.mostrarTooltipGrafico(textoTooltip, e));
            barra.addEventListener('mousemove', e => this.mostrarTooltipGrafico(textoTooltip, e));
            barra.addEventListener('mouseleave', () => this.ocultarTooltipGrafico());
            cont.appendChild(barra);
        });
    }

    static renderTabsMonedas(contenedorId, monedaActiva, conBotonAgregar) {
        const cont = document.getElementById(contenedorId);
        cont.innerHTML = window.db.monedas.map(m => `
            <button draggable="true" data-id="${m}" data-tipo="moneda" data-accion="cambiar-moneda" data-ctx="${contenedorId}" data-moneda="${m}"
                class="elemento-arrastrable nb-btn rounded-lg px-4 py-1 font-bold ${m === monedaActiva ? 'bg-accent text-neutral-900' : 'bg-card dark:bg-card-dark'}">
                ${m}
            </button>
        `).join('');
        if (conBotonAgregar) {
            cont.innerHTML += `<button data-accion="nueva-moneda" class="nb-btn bg-card dark:bg-card-dark rounded-lg px-4 py-1 font-black">+</button>`;
        }
    }

    static renderInicio() {
        const m = window.estado.monedaInicio;
        this.renderTabsMonedas('inicio-monedas', m, false);

        document.querySelectorAll('[data-periodo]').forEach(btn => {
            const activo = btn.dataset.periodo === window.estado.periodo;
            btn.classList.toggle('bg-accent', activo);
            btn.classList.toggle('text-neutral-900', activo);
            btn.classList.toggle('bg-card', !activo);
            btn.classList.toggle('dark:bg-card-dark', !activo);
        });

        const hoyDate = new Date();
        hoyDate.setHours(23, 59, 59, 999);
        const diasRestar = window.estado.periodo === 'mensual' ? 30 : (window.estado.periodo === 'trimestral' ? 90 : 7);
        const fechaLimite = new Date(hoyDate);
        fechaLimite.setDate(hoyDate.getDate() - diasRestar + 1);
        fechaLimite.setHours(0, 0, 0, 0);

        const datosGraficos = Array.from({ length: diasRestar }, (_, i) => {
            const d = new Date(fechaLimite);
            d.setDate(d.getDate() + i);
            return { fecha: d, label: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }), ingresos: 0, gastos: 0 };
        });

        let sumIngresos = 0, sumGastos = 0;
        window.db.transacciones.filter(t => t.moneda === m).forEach(t => {
            const p = t.fecha.split('-');
            const d = new Date(p[0], p[1] - 1, p[2], 12, 0, 0);
            if (d >= fechaLimite && d <= hoyDate) {
                if (t.tipo === 'ingreso') sumIngresos += t.monto;
                else sumGastos += t.monto;
                const idx = Math.floor((d.getTime() - fechaLimite.getTime()) / (1000 * 3600 * 24));
                if (idx >= 0 && idx < diasRestar) {
                    if (t.tipo === 'ingreso') datosGraficos[idx].ingresos += t.monto;
                    else datosGraficos[idx].gastos += t.monto;
                }
            }
        });

        datosGraficos.forEach(d => d.balance = d.ingresos - d.gastos);

        document.getElementById('total-ingresos').textContent = Moneda.formatear(sumIngresos, m);
        document.getElementById('total-gastos').textContent = Moneda.formatear(sumGastos, m);
        document.getElementById('balance-neto').textContent = Moneda.formatear(sumIngresos - sumGastos, m);

        this.dibujarGraficoCaja('grafico-ingresos', datosGraficos, 'ingresos', 'bg-green-400', m);
        this.dibujarGraficoCaja('grafico-gastos', datosGraficos, 'gastos', 'bg-red-400', m);
        this.dibujarGraficoCaja('grafico-balance', datosGraficos, 'balance', 'bg-accent', m);
    }

    static renderActividad() {
        const m = window.estado.monedaActividad;
        this.renderTabsMonedas('tabs-monedas', m, true);

        const cont = document.getElementById('lista-categorias');
        const categorias = window.db.categorias.filter(c => c.moneda === m);

        if (categorias.length === 0) {
            cont.innerHTML = '<p class="text-center font-bold opacity-70 p-4 border-dashed border-4 border-black rounded-xl">No hay categorías en esta moneda.</p>';
            return;
        }

        cont.innerHTML = categorias.map(cat => {
            const htmlTxs = window.db.transacciones.filter(t => t.categoriaId === cat.id).map(t => `
                <li draggable="true" data-id="${t.id}" data-tipo="tx" data-categoria-id="${cat.id}"
                    class="elemento-arrastrable nb-sm rounded-lg p-3 flex items-center gap-3 cursor-grab bg-white dark:bg-base-dark mt-2"
                    style="background-color: ${t.color}">
                    <button data-accion="color-tx" data-id="${t.id}" class="nb-btn bg-white rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center bg-opacity-70">
                        <img src="assets/cat_face.png" alt="Carita" class="w-8 h-8 object-contain">
                    </button>
                    <div class="flex-1 min-w-0">
                        <p class="font-bold truncate text-black">${t.descripcion}</p>
                        <p class="text-xs truncate text-black opacity-80">${t.fecha} ${t.vencimiento ? '| Vence: ' + t.vencimiento : ''}</p>
                        ${t.anotacion ? `<p class="text-xs italic text-black opacity-70 mt-1">${t.anotacion}</p>` : ''}
                    </div>
                    <p class="font-black text-lg text-black">${t.tipo === 'gasto' ? '−' : '+'}${Moneda.formatear(t.monto, m)}</p>
                    <div class="flex flex-col gap-1">
                        <button data-accion="editar-tx" data-id="${t.id}" class="nb-btn bg-white text-black rounded text-xs px-2 py-1 font-bold">✎</button>
                        <button data-accion="borrar-tx" data-id="${t.id}" class="nb-btn bg-red-400 text-black rounded text-xs px-2 py-1 font-bold">×</button>
                    </div>
                </li>
            `).join('');

            return `
                <article draggable="true" data-id="${cat.id}" data-tipo="cat" class="elemento-arrastrable nb bg-card dark:bg-card-dark rounded-xl p-4 cursor-grab">
                    <header class="flex items-center justify-between gap-3">
                        <button data-accion="agregar-tx" data-id="${cat.id}" class="nb-btn bg-accent text-neutral-900 rounded-full w-10 h-10 font-black text-xl flex-shrink-0">+</button>
                        <div class="flex-1">
                            <h3 class="font-black text-lg uppercase">${cat.nombre}</h3>
                            ${cat.nota ? `<p class="text-sm opacity-80">${cat.nota}</p>` : ''}
                        </div>
                        <button data-accion="borrar-cat" data-id="${cat.id}" class="nb-btn bg-red-400 text-neutral-900 rounded-lg w-10 h-10 font-black text-xl flex-shrink-0">−</button>
                        <button data-accion="toggle-cat" data-id="${cat.id}" class="nb-btn bg-white dark:bg-gray-700 text-neutral-900 dark:text-white rounded-lg px-3 py-1 font-black flex-shrink-0">${cat.abierta ? '▲' : '▼'}</button>
                    </header>
                    ${cat.abierta ? `<ul class="mt-4 pt-2 border-t-4 border-black">${htmlTxs.length ? htmlTxs : '<p class="text-sm opacity-70 text-center">Sin movimientos</p>'}</ul>` : ''}
                </article>
            `;
        }).join('');
    }

    static revisarNotificaciones() {
        const hoyDate = new Date();
        hoyDate.setHours(0, 0, 0, 0);
        window.alertasActuales = [];

        window.db.transacciones.forEach(t => {
            if (!t.vencimiento) return;
            const partes = t.vencimiento.split('-');
            const diffDias = (new Date(partes[0], partes[1] - 1, partes[2]).getTime() - hoyDate.getTime()) / (1000 * 3600 * 24);
            if (diffDias >= 0 && diffDias <= 1) window.alertasActuales.push(t);
        });

        const badge = document.getElementById('badge-notificaciones');
        if (window.alertasActuales.length > 0) {
            badge.textContent = window.alertasActuales.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    static limpiarIndicadoresCategorias() {
        document.querySelectorAll('.categoria-destino').forEach(el => el.classList.remove('categoria-destino'));
    }

    static ocultarPapelera() {
        const papelera = document.getElementById('papelera');
        papelera.classList.add('hidden');
        papelera.classList.remove('sobre');
        this.limpiarIndicadoresCategorias();
    }
}
