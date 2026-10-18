const repositorio = require('../data/tiendaRepository');

function obtenerProductos() {
    return repositorio.listarProductos();
}

function obtenerProductoPorId(id) {
    const idNumero = Number(id);
    if (!Number.isInteger(idNumero) || idNumero <= 0) {
        return null;
    }
    return repositorio.buscarProductoPorId(idNumero) || null;
}

function registrarPedido(datos) {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        return { ok: false, codigo: 400, error: 'El formato del pedido no es válido.' };
    }

    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
    const correo = typeof datos.correo === 'string' ? datos.correo.trim() : '';

    if (!nombre) {
        return { ok: false, codigo: 400, error: 'El nombre del comprador es obligatorio.' };
    }
    if (!correo || !correo.includes('@')) {
        return { ok: false, codigo: 400, error: 'El correo del comprador es obligatorio y debe ser válido.' };
    }

    if (!Array.isArray(datos.items) || datos.items.length === 0) {
        return { ok: false, codigo: 400, error: 'El pedido debe incluir al menos un producto en items.' };
    }

    // Validar cada ítem y agrupar productos repetidos sumando sus cantidades
    const cantidadesPorProducto = new Map();

    for (const item of datos.items) {
        if (!item || typeof item !== 'object') {
            return { ok: false, codigo: 400, error: 'Cada ítem del pedido debe ser un objeto válido.' };
        }

        const productoId = Number(item.producto_id);
        const cantidad = item.cantidad;

        if (!Number.isInteger(productoId) || productoId <= 0) {
            return { ok: false, codigo: 400, error: 'El identificador de cada producto debe ser un entero positivo.' };
        }

        if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad <= 0) {
            return { ok: false, codigo: 400, error: 'La cantidad de cada producto debe ser un número entero positivo.' };
        }

        const acumulada = cantidadesPorProducto.get(productoId) || 0;
        cantidadesPorProducto.set(productoId, acumulada + cantidad);
    }

    // Verificar existencia en base de datos y calcular subtotales y total con precios de SQLite
    const itemsCalculados = [];
    let totalCalculado = 0;

    for (const [productoId, cantidadTotal] of cantidadesPorProducto.entries()) {
        const productoDb = repositorio.buscarProductoPorId(productoId);
        if (!productoDb) {
            return {
                ok: false,
                codigo: 400,
                error: `El producto con id ${productoId} no existe en el catálogo.`
            };
        }

        const precioUnitario = productoDb.precio;
        const subtotal = precioUnitario * cantidadTotal;
        totalCalculado += subtotal;

        itemsCalculados.push({
            producto_id: productoDb.id,
            nombre: productoDb.nombre,
            cantidad: cantidadTotal,
            precio_unitario: precioUnitario,
            subtotal
        });
    }

    const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const pedidoGuardado = repositorio.crearPedidoConDetalles({
        nombre,
        correo,
        fecha,
        total: totalCalculado,
        items: itemsCalculados
    });

    return { ok: true, codigo: 201, datos: pedidoGuardado };
}

function obtenerPedidos() {
    return repositorio.listarPedidosConDetalles();
}

module.exports = {
    obtenerProductos,
    obtenerProductoPorId,
    registrarPedido,
    obtenerPedidos
};