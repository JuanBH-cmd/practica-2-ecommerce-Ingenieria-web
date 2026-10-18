# Base para la práctica del 20 por ciento

Primera versión académica de una tienda web. El objetivo del equipo es completar catálogo, carrito y pedidos aplicando OOHDM, API HTTP con JSON, SQLite y MVC organizado en capas. La guía de evaluación adjunta define la entrega y la sustentación presencial.

## Ejecutar
Requiere Node.js >=24.11.0. Detén el servidor anterior con Ctrl + C y abre una terminal en esta carpeta.

```powershell
node --version
npm start
```

Abre http://localhost:3000. No hay dependencias externas ni se requiere npm install. Si PowerShell bloquea npm.ps1, usa `npm.cmd start` o `node server_rutas.js`.

Al iniciar se crea data/tienda.db y se agregan seis productos ficticios. Reiniciar no borra los registros ni duplica esos productos. La siembra inicial usa identificadores 1 a 6; para cambiar su contenido en una base existente, actualiza esos registros con SQL, además de ajustar los datos iniciales para las instalaciones nuevas. No borres una base con pedidos que necesites conservar.

## Qué funciona en esta base
- Servidor HTTP y entrega de HTML, CSS y JavaScript.
- Esquema SQLite de productos, pedidos y detalle_pedido, con claves foráneas activas.
- Catálogo de seis productos, leído con fetch desde GET /api/productos.
- GET /api/productos/:id, incluidos los errores 404.
- Ayuda para leer JSON y para ejecutar una transacción de SQLite.

## Qué debe desarrollar el equipo
- Carrito y formulario de pedido; confirmación después de guardar.
- POST /api/pedidos y GET /api/pedidos y vista de consulta.
- Reglas de negocio, cálculo de precios en el servidor y almacenamiento relacionado.
- Organización MVC y capas (el servidor inicial concentra responsabilidades a propósito).
- Diseños OOHDM, documentación, pruebas y sustentación.

Las páginas de carrito y pedidos son puntos de partida. Sus endpoints responden 501 hasta completarlos. No es una falla de instalación ni una solución terminada. Abre docs/CONTRATO_API.md y docs/PLAN_DE_TRABAJO.md.

## Alcance
Compra simulada, sin cobro. Se trabaja localmente con datos ficticios. No se exige autenticación, pagos reales, envíos, inventario, administración de productos ni ontologías en esta práctica.

## Entrega
Subir a un repositorio Git accesible al docente: código fuente, esquema y datos iniciales, package.json, README y docs/. El archivo .gitignore excluye la base generada, secretos y dependencias. Registrar los aportes de ambos integrantes; no se exige un número artificial de commits. La guía determina los criterios de evaluación.
