// Servidor principal: inicia HTTP y delega las solicitudes al enrutador (MVC en capas).
const http = require('node:http');
const { manejarRutas } = require('./routes/rutas');
const { responderJson } = require('./controllers/tiendaController');
const { cerrarDb } = require('./data/tiendaRepository');

const servidor = http.createServer(async (req, res) => {
  console.log(req.method, req.url);
  try {
    await manejarRutas(req, res);
  } catch (error) {
    if (!error.status) console.error(error.message);
    if (!res.headersSent) {
      responderJson(res, error.status || 500, {
        error: error.status ? error.message : 'Error interno del servidor.'
      });
    } else {
      res.end();
    }
  }
});

servidor.on('error', (error) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? 'Puerto ocupado. Detén el servidor anterior con Ctrl + C.'
      : error.message
  );
  cerrarDb();
  process.exitCode = 1;
});

servidor.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => {
  console.log(`Catálogo disponible en http://localhost:${servidor.address().port}`);
});

process.on('SIGINT', () => servidor.close(() => { cerrarDb(); process.exit(0); }));
process.on('SIGTERM', () => servidor.close(() => { cerrarDb(); process.exit(0); }));