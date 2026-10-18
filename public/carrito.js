const CLAVE_CARRITO = 'carrito_tienda_aula';
const estado = document.getElementById('estado');
const contenedorItems = document.getElementById('contenedorItems');
const resumenCarrito = document.getElementById('resumenCarrito');
const totalProvisionalEl = document.getElementById('totalProvisional');
const seccionFormulario = document.getElementById('seccionFormulario');
const formPedido = document.getElementById('formPedido');
const btnVaciar = document.getElementById('btnVaciar');
const confirmacionPedido = document.getElementById('confirmacionPedido');

const moneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
});

function leerCarrito() {
    try {
        const guardado = localStorage.getItem(CLAVE_CARRITO);
        const items = guardado ? JSON.parse(guardado) : [];
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

function guardarCarrito(items) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
}

function cambiarCantidad(productoId, nuevaCantidad) {
    const cantidadNumero = Number(nuevaCantidad);
    if (!Number.isInteger(cantidadNumero) || cantidadNumero < 1) {
        estado.textContent = 'La cantidad debe ser un número entero mayor o igual a 1.';
        renderizarCarrito();
        return;
    }

    const carrito = leerCarrito();
    const item = carrito.find((i) => i.producto_id === productoId);
    if (item) {
        item.cantidad = cantidadNumero;
        guardarCarrito(carrito);
        estado.textContent = 'Cantidad actualizada.';
        renderizarCarrito();
    }
}

function eliminarProducto(productoId) {
    const carrito = leerCarrito().filter((i) => i.producto_id !== productoId);
    guardarCarrito(carrito);
    estado.textContent = 'Producto eliminado del carrito.';
    renderizarCarrito();
}

function renderizarCarrito() {
    const carrito = leerCarrito();
    contenedorItems.replaceChildren();

    if (carrito.length === 0) {
        const parrafoVacio = document.createElement('p');
        parrafoVacio.textContent = 'Tu carrito está vacío. Agrega productos desde el catálogo para realizar un pedido.';
        const enlaceCatalogo = document.createElement('a');
        enlaceCatalogo.className = 'boton';
        enlaceCatalogo.href = '/';
        enlaceCatalogo.textContent = 'Ir al catálogo';
        contenedorItems.append(parrafoVacio, enlaceCatalogo);

        resumenCarrito.hidden = true;
        seccionFormulario.hidden = true;
        return;
    }

    const tabla = document.createElement('table');
    tabla.className = 'tabla';

    const thead = document.createElement('thead');
    const filaHead = document.createElement('tr');
    for (const titulo of ['Producto', 'Precio unitario', 'Cantidad', 'Subtotal', 'Acción']) {
        const th = document.createElement('th');
        th.textContent = titulo;
        filaHead.appendChild(th);
    }
    thead.appendChild(filaHead);

    const tbody = document.createElement('tbody');
    let totalProvisional = 0;

    for (const item of carrito) {
        const fila = document.createElement('tr');
        const subtotal = item.precio * item.cantidad;
        totalProvisional += subtotal;

        const tdNombre = document.createElement('td');
        tdNombre.textContent = item.nombre;

        const tdPrecio = document.createElement('td');
        tdPrecio.textContent = moneda.format(item.precio);

        const tdCantidad = document.createElement('td');
        const inputCantidad = document.createElement('input');
        inputCantidad.type = 'number';
        inputCantidad.min = '1';
        inputCantidad.step = '1';
        inputCantidad.value = String(item.cantidad);
        inputCantidad.className = 'input-cantidad';
        inputCantidad.setAttribute('aria-label', `Cantidad de ${item.nombre}`);
        inputCantidad.addEventListener('change', (e) => {
            cambiarCantidad(item.producto_id, e.target.value);
        });
        tdCantidad.appendChild(inputCantidad);

        const tdSubtotal = document.createElement('td');
        tdSubtotal.textContent = moneda.format(subtotal);

        const tdAccion = document.createElement('td');
        const btnEliminar = document.createElement('button');
        btnEliminar.type = 'button';
        btnEliminar.className = 'boton-eliminar';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.addEventListener('click', () => eliminarProducto(item.producto_id));
        tdAccion.appendChild(btnEliminar);

        fila.append(tdNombre, tdPrecio, tdCantidad, tdSubtotal, tdAccion);
        tbody.appendChild(fila);
    }

    tabla.append(thead, tbody);
    contenedorItems.appendChild(tabla);

    totalProvisionalEl.textContent = moneda.format(totalProvisional);
    resumenCarrito.hidden = false;
    seccionFormulario.hidden = false;
}

function mostrarConfirmacion(pedido) {
    confirmacionPedido.replaceChildren();
    confirmacionPedido.hidden = false;

    const titulo = document.createElement('h2');
    titulo.textContent = `¡Pedido #${pedido.id} registrado con éxito!`;

    const infoComprador = document.createElement('p');
    infoComprador.textContent = `Comprador: ${pedido.nombre} (${pedido.correo}) · Fecha: ${pedido.fecha}`;

    const infoTotal = document.createElement('p');
    infoTotal.className = 'precio';
    infoTotal.textContent = `Total calculado por el servidor: ${moneda.format(pedido.total)}`;

    const lista = document.createElement('ul');
    for (const item of pedido.items) {
        const li = document.createElement('li');
        li.textContent = `${item.nombre} — Cantidad: ${item.cantidad} × ${moneda.format(item.precio_unitario)} = ${moneda.format(item.subtotal)}`;
        lista.appendChild(li);
    }

    const enlacePedidos = document.createElement('a');
    enlacePedidos.className = 'boton';
    enlacePedidos.href = '/pedidos';
    enlacePedidos.textContent = 'Ver todos los pedidos';

    confirmacionPedido.append(titulo, infoComprador, infoTotal, lista, enlacePedidos);
}

btnVaciar.addEventListener('click', () => {
    guardarCarrito([]);
    confirmacionPedido.hidden = true;
    estado.textContent = 'Se vació el carrito.';
    renderizarCarrito();
});

formPedido.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    confirmacionPedido.hidden = true;

    const carrito = leerCarrito();
    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;

    // Enviar únicamente producto_id y cantidad; el servidor consulta precios en SQLite
    const items = carrito.map((item) => ({
        producto_id: item.producto_id,
        cantidad: Number(item.cantidad)
    }));

    try {
        estado.textContent = 'Enviando pedido...';
        const respuesta = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, correo, items })
        });
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.error || 'No fue posible registrar el pedido.');
        }

        // Vaciar el carrito únicamente tras respuesta exitosa (201)
        guardarCarrito([]);
        formPedido.reset();
        estado.textContent = 'Pedido registrado correctamente.';
        renderizarCarrito();
        mostrarConfirmacion(datos);
    } catch (error) {
        estado.textContent = `Error: ${error.message}`;
    }
});

renderizarCarrito();