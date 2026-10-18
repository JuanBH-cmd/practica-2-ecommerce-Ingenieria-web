// BASE DOCENTE: catálogo funcional. Rutas, SQL y HTTP están juntos a propósito.
// ACTIVIDAD: separar responsabilidades con capas y MVC y completar los pedidos.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const archivoDb = process.env.TIENDA_DB_PATH
  ? path.resolve(process.env.TIENDA_DB_PATH) : path.join(__dirname, 'data', 'tienda.db');
fs.mkdirSync(path.dirname(archivoDb), { recursive: true });
const db = new DatabaseSync(archivoDb);
db.exec(fs.readFileSync(path.join(__dirname, 'data', 'esquema.sql'), 'utf8'));
const iniciales = [
  [1, 'Cuaderno', 'Cuaderno de 100 hojas para tus clases.', 12000],
  [2, 'Bolígrafo', 'Bolígrafo de tinta azul.', 2500],
  [3, 'Carpeta', 'Carpeta para organizar documentos.', 6000],
  [4, 'Resaltador', 'Resaltador amarillo.', 4000],
  [5, 'Agenda', 'Agenda para planear tus actividades.', 18000],
  [6, 'Estuche', 'Estuche para tus útiles.', 15000]
];
const sembrar = db.prepare('INSERT OR IGNORE INTO productos (id,nombre,descripcion,precio) VALUES (?,?,?,?)');
for (const fila of iniciales) sembrar.run(...fila);
const listarProductos = db.prepare('SELECT id,nombre,descripcion,precio FROM productos ORDER BY id');
const buscarProducto = db.prepare('SELECT id,nombre,descripcion,precio FROM productos WHERE id = ?');
function responderJson(res, codigo, datos) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=UTF-8' });
  res.end(JSON.stringify(datos));
}
// Ayuda para el nuevo POST con JSON. Tras reorganizar, corresponde a HTTP/controlador.
async function leerJson(req) {
  const partes=[]; let bytes=0;
  for await (const parte of req) {
    bytes += parte.length;
    if (bytes > 65536) {
      const error = new Error('La solicitud es demasiado grande.'); error.status=413; throw error;
    }
    partes.push(parte);
  }
  try { return JSON.parse(Buffer.concat(partes).toString('utf8')); }
  catch { const error=new Error('El cuerpo debe ser JSON válido.'); error.status=400; throw error; }
}
// Ayuda para guardar un pedido y sus detalles como una sola operación.
// Tras reorganizar, esta función corresponde al repositorio, junto con el SQL.
function enTransaccion(operacion) {
  db.exec('BEGIN TRANSACTION');
  try { const resultado=operacion(); db.exec('COMMIT'); return resultado; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
// Ejemplo de uso futuro: enTransaccion(() => { /* INSERT pedido e INSERT detalles */ });
const archivos = {
  '/':['views/index.html','text/html; charset=UTF-8'],
  '/carrito':['views/carrito.html','text/html; charset=UTF-8'],
  '/pedidos':['views/pedidos.html','text/html; charset=UTF-8'],
  '/styles.css':['public/styles.css','text/css; charset=UTF-8'],
  '/catalogo.js':['public/catalogo.js','text/javascript; charset=UTF-8']
};
const servidor = http.createServer(async (req,res) => {
  console.log(req.method, req.url);
  try {
    const ruta = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && Object.hasOwn(archivos,ruta)) {
      const [archivo,tipo]=archivos[ruta];
      res.writeHead(200,{'Content-Type':tipo});
      return res.end(fs.readFileSync(path.join(__dirname,archivo)));
    }
    if (req.method === 'GET' && ruta === '/api/productos') {
      return responderJson(res,200,listarProductos.all());
    }
    const coincidencia = ruta.match(/^\/api\/productos\/(\d+)$/);
    if (req.method === 'GET' && coincidencia) {
      const producto=buscarProducto.get(Number(coincidencia[1]));
      return producto ? responderJson(res,200,producto)
        : responderJson(res,404,{error:'Producto no encontrado.'});
    }
    if (req.method === 'POST' && ruta === '/api/pedidos') {
      if ((req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/json')
        return responderJson(res,415,{error:'Envía Content-Type: application/json.'});
      await leerJson(req);
      // TODO: validar en el modelo; consultar precios; guardar pedido y detalles.
      return responderJson(res,501,{error:'Registro de pedidos pendiente de implementar por el equipo.'});
    }
    if (req.method === 'GET' && ruta === '/api/pedidos') {
      // TODO: consultar pedidos y sus detalles y devolver un arreglo JSON.
      return responderJson(res,501,{error:'Consulta de pedidos pendiente de implementar por el equipo.'});
    }
    return responderJson(res,404,{error:'Ruta no encontrada.'});
  } catch(error) {
    if (!error.status) console.error(error.message);
    if (!res.headersSent) responderJson(res,error.status||500,{error:error.status?error.message:'Error interno del servidor.'});
    else res.end();
  }
});
servidor.on('error',error => {
  console.error(error.code === 'EADDRINUSE' ? 'Puerto ocupado. Detén el servidor anterior con Ctrl + C.' : error.message);
  db.close(); process.exitCode=1;
});
servidor.listen(Number(process.env.PORT || 3000),'127.0.0.1',()=>console.log(`Catálogo disponible en http://localhost:${servidor.address().port}`));
process.on('SIGINT',()=>servidor.close(()=>{db.close();process.exit(0);}));
process.on('SIGTERM',()=>servidor.close(()=>{db.close();process.exit(0);}));
