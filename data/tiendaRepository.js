const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const archivoDb = process.env.TIENDA_DB_PATH
    ? path.resolve(process.env.TIENDA_DB_PATH)
    : path.join(__dirname, 'tienda.db');

fs.mkdirSync(path.dirname(archivoDb), { recursive: true });
const db = new DatabaseSync(archivoDb);

// Ejecutar esquema SQL y activar claves foráneas
db.exec(fs.readFileSync(path.join(__dirname, 'esquema.sql'), 'utf8'));

// Datos iniciales del catálogo (6 productos de Tienda de aula)
const iniciales = [
    [1, 'Cuaderno', 'Cuaderno de 100 hojas para tus clases.', 12000],
    [2, 'Bolígrafo', 'Bolígrafo de tinta azul.', 2500],
    [3, 'Carpeta', 'Carpeta para organizar documentos.', 6000],
    [4, 'Resaltador', 'Resaltador amarillo.', 4000],
    [5, 'Agenda', 'Agenda para planear tus actividades.', 18000],
    [6, 'Estuche', 'Estuche para tus útiles.', 15000]
];

const sembrarSql = db.prepare(
    'INSERT OR IGNORE INTO productos (id, nombre, descripcion, precio) VALUES (?, ?, ?, ?)'
);
for (const fila of iniciales) {
    sembrarSql.run(...fila);
}

// Consultas preparadas
const listarProductosSql = db.prepare(
    'SELECT id, nombre, descripcion, precio FROM productos ORDER BY id'
);
const buscarProductoSql = db.prepare(
    'SELECT id, nombre, descripcion, precio FROM productos WHERE id = ?'
);
const insertarPedidoSql = db.prepare(
    'INSERT INTO pedidos (nombre, correo, fecha, total) VALUES (?, ?, ?, ?)'
);
const insertarDetalleSql = db.prepare(
    'INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)'
);
const listarPedidosSql = db.prepare(
    'SELECT id, nombre, correo, fecha, total FROM pedidos ORDER BY id DESC'
);
const listarDetallesPedidoSql = db.prepare(`
  SELECT d.producto_id, p.nombre, d.cantidad, d.precio_unitario,
         (d.cantidad * d.precio_unitario) AS subtotal
  FROM detalle_pedido d
  JOIN productos p ON p.id = d.producto_id
  WHERE d.pedido_id = ?
  ORDER BY d.id
`);

// Función suministrada en la base, reubicada en el repositorio para atomicidad
function enTransaccion(operacion) {
    db.exec('BEGIN TRANSACTION');
    try {
        const resultado = operacion();
        db.exec('COMMIT');
        return resultado;
    } catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}

function listarProductos() {
    return listarProductosSql.all();
}

function buscarProductoPorId(id) {
    return buscarProductoSql.get(id);
}

function crearPedidoConDetalles({ nombre, correo, fecha, total, items }) {
    return enTransaccion(() => {
        const infoPedido = insertarPedidoSql.run(nombre, correo, fecha, total);
        const pedidoId = Number(infoPedido.lastInsertRowid);

        for (const item of items) {
            insertarDetalleSql.run(
                pedidoId,
                item.producto_id,
                item.cantidad,
                item.precio_unitario
            );
        }

        return {
            id: pedidoId,
            nombre,
            correo,
            fecha,
            total,
            items
        };
    });
}

function listarPedidosConDetalles() {
    const pedidos = listarPedidosSql.all();
    return pedidos.map((pedido) => ({
        id: pedido.id,
        nombre: pedido.nombre,
        correo: pedido.correo,
        fecha: pedido.fecha,
        total: pedido.total,
        items: listarDetallesPedidoSql.all(pedido.id)
    }));
}

function cerrarDb() {
    db.close();
}

module.exports = {
    listarProductos,
    buscarProductoPorId,
    crearPedidoConDetalles,
    listarPedidosConDetalles,
    cerrarDb
};