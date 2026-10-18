const controlador = require('../controllers/tiendaController');

const archivos = {
    '/': ['views/index.html', 'text/html; charset=UTF-8'],
    '/carrito': ['views/carrito.html', 'text/html; charset=UTF-8'],
    '/pedidos': ['views/pedidos.html', 'text/html; charset=UTF-8'],
    '/styles.css': ['public/styles.css', 'text/css; charset=UTF-8'],
    '/catalogo.js': ['public/catalogo.js', 'text/javascript; charset=UTF-8'],
    '/carrito.js': ['public/carrito.js', 'text/javascript; charset=UTF-8'],
    '/pedidos.js': ['public/pedidos.js', 'text/javascript; charset=UTF-8']
};

async function manejarRutas(req, res) {
    const ruta = new URL(req.url, 'http://localhost').pathname;

    if (req.method === 'GET' && Object.hasOwn(archivos, ruta)) {
        const [archivo, tipo] = archivos[ruta];
        return controlador.servirArchivo(res, archivo, tipo);
    }

    if (req.method === 'GET' && ruta === '/api/productos') {
        return controlador.listarProductos(req, res);
    }

    const coincidenciaProducto = ruta.match(/^\/api\/productos\/(\d+)$/);
    if (req.method === 'GET' && coincidenciaProducto) {
        return controlador.obtenerProducto(req, res, Number(coincidenciaProducto[1]));
    }

    if (req.method === 'POST' && ruta === '/api/pedidos') {
        return await controlador.crearPedido(req, res);
    }

    if (req.method === 'GET' && ruta === '/api/pedidos') {
        return controlador.listarPedidos(req, res);
    }

    return controlador.responderJson(res, 404, { error: 'Ruta no encontrada.' });
}

module.exports = { manejarRutas };