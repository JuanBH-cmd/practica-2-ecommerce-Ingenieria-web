# Evidencias de Pruebas de Aceptación y Registro de Aportes

- **Proyecto:** Tienda de aula — Práctica integradora del 20 %
- **Autor:** Juan Camilo Bedoya Holguin (Modalidad individual)

---

## 1. Matriz de los 9 Casos Mínimos de Aceptación

Todos los casos fueron comprobados sobre la aplicación en ejecución (`http://localhost:3000`) utilizando el navegador, las herramientas de desarrollador (pestaña Red / Consola) y la base de datos SQLite (`data/tienda.db`).

| Caso | Entrada o acción | Resultado esperado | Resultado observado | Evidencia / Comprobación |
|---|---|---|---|---|
| **1. Catálogo** | Abrir `http://localhost:3000/` en el navegador y consultar `GET /api/productos` en la pestaña Red. | La página muestra los 6 productos obtenidos por la API y `GET /api/productos` responde `200 OK` con un arreglo JSON de 6 objetos. | Se renderizan las 6 tarjetas (*Cuaderno, Bolígrafo, Carpeta, Resaltador, Agenda, Estuche*) con sus precios en COP y estado `"6 productos disponibles."`. La petición devuelve `200` y JSON. | Vista principal `/` y pestaña Red (`GET /api/productos` → `200`). |
| **2. Carrito** | En `/` agregar *Cuaderno* ($12.000) y *Bolígrafo* ($2.500). Ir a `/carrito`, cambiar cantidad de *Cuaderno* a `2`, eliminar *Bolígrafo* y luego pulsar `Vaciar carrito`. | Al cambiar cantidad: subtotal de Cuaderno pasa a `$24.000` y total provisional a `$26.500`. Al eliminar Bolígrafo: total pasa a `$24.000`. Al vaciar: se oculta la tabla y muestra mensaje de carrito vacío. | Los subtotales y el total provisional se actualizan inmediatamente en pantalla y en `localStorage`. Al pulsar `Vaciar carrito`, se muestra `"Se vació el carrito."` y `"Tu carrito está vacío..."`. | Interacción en `/carrito` y almacenamiento `localStorage` (`carrito_tienda_aula`). |
| **3. Pedido válido** | Enviar `POST /api/pedidos` con `nombre: "Camilo"`, `correo: "juan@gmail.com"` e `items: [{producto_id: 1, cantidad: 2}, {producto_id: 2, cantidad: 1}]`. | El servidor responde `201 Created`, calcula `total: 26500`, guarda 1 fila en `pedidos` y 2 filas en `detalle_pedido`, muestra la confirmación y vacía el carrito. | Respuesta `201` recibida con `id: 1` y `total: 26500`. El carrito quedó vacío y en `/pedidos` se visualiza el Pedido #1 con sus dos renglones (*Cuaderno x2 = $24.000* y *Bolígrafo x1 = $2.500*). | Confirmación en `/carrito`, vista `/pedidos` y registros en `data/tienda.db`. |
| **4. Datos del comprador** | Enviar `POST /api/pedidos` con `nombre: "   "` (vacío) o `correo: ""` junto con ítems válidos. | El servidor responde `400 Bad Request` con mensaje explicativo en JSON y no crea registros en `pedidos` ni en `detalle_pedido`. | El servidor respondió `400` con `{"error":"El nombre del comprador es obligatorio."}` (y para correo vacío: `{"error":"El correo del comprador es obligatorio y debe ser válido."}`). No se crearon registros nuevos. | Respuesta `400` en consola/Red y conteo de pedidos sin cambios en `/api/pedidos`. |
| **5. Carrito vacío** | Enviar `POST /api/pedidos` con `nombre: "Ana"`, `correo: "ana@example.com"` e `items: []`. | El servidor responde `400 Bad Request` y no inserta ningún registro en la base de datos. | El servidor respondió `400` con `{"error":"El pedido debe incluir al menos un producto en items."}` y la base de datos permaneció intacta. | Petición `fetch` de prueba en consola (`Status 400`). |
| **6. Cantidad inválida** | Enviar directamente a `POST /api/pedidos` cantidades `0`, `-3` o `1.5` (no entera). | El servidor rechaza la solicitud con estado `400 Bad Request` y no registra el pedido. | El servidor respondió `400` con `{"error":"La cantidad de cada producto debe ser un número entero positivo."}` en los tres casos. | Petición `fetch` directa a la API (`Status 400`). |
| **7. Producto inválido** | Enviar `POST /api/pedidos` con un producto válido (`producto_id: 1, cantidad: 1`) y uno inexistente (`producto_id: 999, cantidad: 1`). | El servidor responde `400 Bad Request` y garantiza que no queden pedidos ni detalles parciales en SQLite. | El servidor respondió `400` con `{"error":"El producto con id 999 no existe en el catálogo."}`. Al consultar `GET /api/pedidos`, se comprobó que no se creó ningún pedido ni detalle parcial. | Petición `fetch` combinada (`Status 400`) y verificación en `/api/pedidos`. |
| **8. Total alterado** | Enviar `POST /api/pedidos` con 2 Cuadernos ($12.000 c/u) incluyendo campos adulterados: `"precio": 1, "total": 50`. | El servidor ignora el precio/total del cliente y calcula el valor real (`24000` COP) con los precios de SQLite. | El servidor respondió `201` con `"precio_unitario": 12000`, `"subtotal": 24000` y `"total": 24000`, ignorando los valores ficticios enviados desde el navegador. | Petición `fetch` con JSON alterado y respuesta `201` con total `24000`. |
| **9. Persistencia** | Registrar un pedido válido, detener el servidor (`Ctrl + C`), volver a ejecutar `npm start`, abrir `/pedidos` y consultar `GET /api/productos/999`. | Los pedidos registrados siguen disponibles con sus detalles tras reiniciar. El producto inexistente responde `404 Not Found`. | Tras reiniciar `node server_rutas.js`, `GET /api/pedidos` y la vista `/pedidos` conservaron todos los pedidos registrados en `data/tienda.db`. La ruta `/api/productos/999` respondió `404` con `{"error":"Producto no encontrado."}`. | Reinicio en terminal, vista `/pedidos` y respuesta `404` en `/api/productos/999`. |

---

## 2. Script de Comprobación Rápida en Consola del Navegador (Casos 4, 5, 6, 7, 8 y 9)

Durante la demostración en vivo, además de usar la interfaz gráfica para los casos 1, 2, 3 y 9, se pueden abrir las Herramientas de Desarrollador (`F12` → pestaña **Consola**) en `http://localhost:3000` y pegar este bloque para demostrar en segundos los rechazos `400`, el cálculo seguro del caso 8 y el `404` del caso 9:

```javascript
async function probarCaso(nombreCaso, url, opciones) {
  const res = await fetch(url, opciones);
  const data = await res.json();
  console.log(`[${nombreCaso}] Estado HTTP: ${res.status}`, data);
}

// Caso 4: Datos del comprador vacíos
await probarCaso('Caso 4 - Comprador vacío', '/api/pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: '   ', correo: '', items: [{ producto_id: 1, cantidad: 1 }] })
});

// Caso 5: Carrito vacío (items: [])
await probarCaso('Caso 5 - Items vacío', '/api/pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'Juan', correo: 'juan@ucc.edu.co', items: [] })
});

// Caso 6: Cantidad inválida (0, negativa o decimal)
await probarCaso('Caso 6 - Cantidad inválida', '/api/pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'Juan', correo: 'juan@ucc.edu.co', items: [{ producto_id: 1, cantidad: -2 }] })
});

// Caso 7: Producto inexistente junto con uno válido
await probarCaso('Caso 7 - Producto inexistente', '/api/pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Juan',
    correo: 'juan@ucc.edu.co',
    items: [{ producto_id: 1, cantidad: 1 }, { producto_id: 999, cantidad: 1 }]
  })
});

// Caso 8: Total y precio alterados por el cliente
await probarCaso('Caso 8 - Total alterado (envía total: 50, servidor calcula 24000)', '/api/pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Prueba Total Seguro',
    correo: 'seguro@ucc.edu.co',
    total: 50,
    items: [{ producto_id: 1, cantidad: 2, precio: 1, subtotal: 2 }]
  })
});

// Caso 9: Producto inexistente GET /api/productos/999 (404)
await probarCaso('Caso 9 - Producto 999 no encontrado', '/api/productos/999');
```

---

## 3. Descripción de Aportes

El proyecto se desarrolló en **modalidad individual** por **Juan Camilo Bedoya Holguin**, asumiendo el 100 % de las actividades de diseño, desarrollo, pruebas y documentación:

- **Diseño OOHDM y Arquitectura:** Elaboración del modelo conceptual (`Producto`, `Pedido`, `DetallePedido`), esquema navegacional, bocetos de interfaz abstracta, esquema de arquitectura MVC en capas y tabla de correspondencia en `docs/OOHDM.md`.
- **Reorganización Backend en Capas y MVC:** Separación de `server_rutas.js` en `routes/rutas.js`, `controllers/tiendaController.js`, `models/tiendaModel.js` y `data/tiendaRepository.js`, reubicando `leerJson` en el controlador y `enTransaccion` en el repositorio.
- **Desarrollo de la API y Persistencia SQLite:** Implementación de `POST /api/pedidos` y `GET /api/pedidos` con validaciones de negocio en el modelo, cálculo de subtotales/total desde SQLite e inserción transaccional de pedidos y detalles.
- **Desarrollo Frontend y Pruebas:** Implementación del carrito en `localStorage` (`public/catalogo.js`, `public/carrito.js`, `views/carrito.html`), vista de consulta de pedidos (`public/pedidos.js`, `views/pedidos.html`) y ejecución de los 9 casos mínimos de aceptación.