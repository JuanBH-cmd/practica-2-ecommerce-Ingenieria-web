# Contrato de la API que debe completar el equipo

La base resuelve GET /api/productos y GET /api/productos/:id. Los endpoints de pedidos responden 501 deliberadamente hasta que el equipo los implemente. 501 NO es el resultado final esperado.

## Crear pedido
POST /api/pedidos, Content-Type: application/json.

```json
{"nombre":"Ana Ejemplo","correo":"ana@example.com","items":[{"producto_id":1,"cantidad":2},{"producto_id":2,"cantidad":1}]}
```

No enviar precios ni total como fuente de verdad. El servidor consulta los precios en SQLite, valida todos los ítems y calcula cada subtotal y el total.

Con el catálogo original, el total del ejemplo es 26500 COP. Respuesta 201 sugerida:

```json
{"id":1,"nombre":"Ana Ejemplo","correo":"ana@example.com","fecha":"fecha asignada por el servidor","total":26500,"items":[{"producto_id":1,"nombre":"Cuaderno","cantidad":2,"precio_unitario":12000,"subtotal":24000},{"producto_id":2,"nombre":"Bolígrafo","cantidad":1,"precio_unitario":2500,"subtotal":2500}]}
```

El id y la fecha son ejemplos; los genera el servidor. Campos obligatorios: nombre, correo e items no vacío. Cada producto debe existir; cada cantidad debe ser un número entero positivo. Ante datos inválidos: 400 y {"error":"Explicación"}, sin crear pedidos ni detalles. Con JSON mal formado: 400. Con tipo de contenido diferente: 415. El modelo aplica las reglas de negocio; el controlador traduce el resultado a HTTP.

## Consultar pedidos
GET /api/pedidos: 200 y un arreglo de pedidos con el formato anterior (incluye sus ítems). Si no hay pedidos, devolver []. Es una consulta local de demostración con datos ficticios.

## Productos
GET /api/productos: 200 y arreglo de productos (id, nombre, descripcion, precio).
GET /api/productos/:id: 200 y objeto de producto; 404 si no existe.

## Ayuda para enviar desde el navegador
```javascript
const respuesta = await fetch('/api/pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre, correo, items })
});
const datos = await respuesta.json();
if (!respuesta.ok) throw new Error(datos.error || 'No fue posible registrar el pedido.');
// Mostrar el id y total recibidos y vaciar el carrito únicamente tras el éxito.
```

Antes de usar el ejemplo, obtener nombre y correo del formulario e items del carrito. El carrito puede guardarse en sessionStorage o localStorage. El archivo README del equipo debe explicar la opción elegida.
