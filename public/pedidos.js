const estado = document.getElementById('estado');
const listaPedidos = document.getElementById('listaPedidos');
const moneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
});

async function cargarPedidos() {
    try {
        const respuesta = await fetch('/api/pedidos');
        if (!respuesta.ok) throw new Error('No fue posible consultar los pedidos.');
        const pedidos = await respuesta.json();
        listaPedidos.replaceChildren();

        if (pedidos.length === 0) {
            estado.textContent = 'Todavía no hay pedidos registrados.';
            const enlace = document.createElement('a');
            enlace.className = 'boton';
            enlace.href = '/';
            enlace.textContent = 'Ir al catálogo para comprar';
            listaPedidos.appendChild(enlace);
            return;
        }

        estado.textContent = `${pedidos.length} pedido(s) registrado(s).`;

        for (const pedido of pedidos) {
            const tarjeta = document.createElement('article');
            tarjeta.className = 'panel pedido-card';

            const encabezado = document.createElement('div');
            encabezado.className = 'pedido-encabezado';

            const titulo = document.createElement('h2');
            titulo.textContent = `Pedido #${pedido.id} — ${pedido.nombre}`;

            const meta = document.createElement('p');
            meta.textContent = `Correo: ${pedido.correo} · Fecha: ${pedido.fecha}`;

            const total = document.createElement('p');
            total.className = 'precio';
            total.textContent = `Total: ${moneda.format(pedido.total)}`;

            encabezado.append(titulo, meta, total);

            const tabla = document.createElement('table');
            tabla.className = 'tabla';

            const thead = document.createElement('thead');
            const trHead = document.createElement('tr');
            for (const col of ['Producto', 'Cantidad', 'Precio unitario', 'Subtotal']) {
                const th = document.createElement('th');
                th.textContent = col;
                trHead.appendChild(th);
            }
            thead.appendChild(trHead);

            const tbody = document.createElement('tbody');
            for (const item of pedido.items) {
                const tr = document.createElement('tr');

                const tdProd = document.createElement('td');
                tdProd.textContent = item.nombre;

                const tdCant = document.createElement('td');
                tdCant.textContent = String(item.cantidad);

                const tdPrecio = document.createElement('td');
                tdPrecio.textContent = moneda.format(item.precio_unitario);

                const tdSub = document.createElement('td');
                tdSub.textContent = moneda.format(item.subtotal);

                tr.append(tdProd, tdCant, tdPrecio, tdSub);
                tbody.appendChild(tr);
            }

            tabla.append(thead, tbody);
            tarjeta.append(encabezado, tabla);
            listaPedidos.appendChild(tarjeta);
        }
    } catch (error) {
        estado.textContent = error.message;
    }
}

cargarPedidos();