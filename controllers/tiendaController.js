const fs = require('node:fs');
const path = require('node:path');
const modelo = require('../models/tiendaModel');

const RAIZ_PROYECTO = path.join(__dirname, '..');

function responderJson(res, codigo, datos) {
    res.writeHead(codigo, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify(datos));
}

async function leerJson(req) {
    const partes = [];
    let bytes = 0;
    for await (const parte of req) {
        bytes += parte.length;
        if (bytes > 65536) {
            const error = new Error('La solicitud es demasiado grande.');
            error.status = 413;
            throw error;
        }
        partes.push(parte);
    }
    try {
        return JSON.parse(Buffer.concat(partes).toString('utf8'));
    } catch {
        const error = new Error('El cuerpo debe ser JSON válido.');
        error.status = 400;
        throw error;
    }
}

function servirArchivo(res, archivoRelativo, tipoContenido) {
    const rutaCompleta = path.join(RAIZ_PROYECTO, archivoRelativo);
    res.writeHead(200, { 'Content-Type': tipoContenido });
    res.end(fs.readFileSync(rutaCompleta));
}

function listarProductos(req, res) {
    const productos = modelo.obtenerProductos();
    return responderJson(res, 200, productos);
}

function obtenerProducto(req, res, id) {
    const producto = modelo.obtenerProductoPorId(id);
    if (!producto) {
        return responderJson(res, 404, { error: 'Producto no encontrado.' });
    }
    return responderJson(res, 200, producto);
}

async function crearPedido(req, res) {
    const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (contentType !== 'application/json') {
        return responderJson(res, 415, { error: 'Envía Content-Type: application/json.' });
    }

    const cuerpo = await leerJson(req);
    const resultado = modelo.registrarPedido(cuerpo);

    if (!resultado.ok) {
        return responderJson(res, resultado.codigo, { error: resultado.error });
    }

    return responderJson(res, 201, resultado.datos);
}

function listarPedidos(req, res) {
    const pedidos = modelo.obtenerPedidos();
    return responderJson(res, 200, pedidos);
}

module.exports = {
    responderJson,
    servirArchivo,
    listarProductos,
    obtenerProducto,
    crearPedido,
    listarPedidos
};