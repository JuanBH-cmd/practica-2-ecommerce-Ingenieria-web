# Contrato de la API HTTP — Tienda de Aula

La API del sistema sigue un diseño orientado a recursos con intercambio de datos en formato `application/json; charset=UTF-8`. Todas las rutas de la API devuelven tanto sus respuestas exitosas como sus mensajes de error en formato JSON.

---

## 1. Resumen de Endpoints

| Método | Ruta | Entrada (Request Body) | Salida (Response Body) | Códigos de Estado HTTP |
|---|---|---|---|---|
| `GET` | `/api/productos` | Ninguna | Arreglo JSON con los productos del catálogo (`id`, `nombre`, `descripcion`, `precio`). | `200 OK`, `500 Internal Server Error` |
| `GET` | `/api/productos/:id` | Parámetro `:id` numérico en la ruta | Objeto JSON del producto solicitado o mensaje de error si no existe. | `200 OK`, `404 Not Found` |
| `POST` | `/api/pedidos` | JSON con `nombre`, `correo` e `items` (`[{ producto_id, cantidad }]`). | Objeto JSON del pedido creado con `id`, `fecha`, `total` calculado por el servidor e `items` detallados; o `{ "error": "..." }`. | `201 Created`, `400 Bad Request`, `413 Payload Too Large`, `415 Unsupported Media Type`, `500 Internal Server Error` |
| `GET` | `/api/pedidos` | Ninguna | Arreglo JSON de pedidos con sus respectivos arreglos `items`. Devuelve `[]` si no existen pedidos. | `200 OK`, `500 Internal Server Error` |

---

## 2. Detalle de `POST /api/pedidos`

### Encabezado obligatorio
- `Content-Type: application/json` (si se omite o se envía otro tipo de contenido, el controlador responde `415 Unsupported Media Type`).

### Ejemplo de Solicitud (Request)
```json
{
  "nombre": "Ana Ejemplo",
  "correo": "ana@example.com",
  "items": [
    { "producto_id": 1, "cantidad": 2 },
    { "producto_id": 2, "cantidad": 1 }
  ]
}
```

### Reglas aplicadas por el servidor (`models/tiendaModel.js` y `data/tiendaRepository.js`)
1. **Validación de comprador:** `nombre` y `correo` son obligatorios después de aplicar `.trim()`, y el correo debe ser válido.
2. **Validación de ítems:** `items` debe ser un arreglo con al menos un elemento. Cada `producto_id` y `cantidad` debe ser un número entero positivo (`> 0`).
3. **Agrupación de repetidos:** Si la solicitud contiene el mismo `producto_id` en varias líneas, el modelo agrupa el producto sumando sus cantidades antes de validar y calcular.
4. **Cálculo en servidor (fuente de verdad):** El servidor ignora cualquier campo `precio`, `subtotal` o `total` enviado por el cliente. Consulta el precio real de cada producto en SQLite y calcula cada `subtotal` y el `total` del pedido.
5. **Atomicidad:** El pedido y sus detalles se insertan dentro de `enTransaccion()`. Si un producto no existe o cualquier validación falla, se responde `400 Bad Request` y no se guarda ningún registro parcial.

### Ejemplo de Respuesta Exitosa (`201 Created`)
```json
{
  "id": 1,
  "nombre": "Ana Ejemplo",
  "correo": "ana@example.com",
  "fecha": "2026-10-18 02:24:39",
  "total": 26500,
  "items": [
    {
      "producto_id": 1,
      "nombre": "Cuaderno",
      "cantidad": 2,
      "precio_unitario": 12000,
      "subtotal": 24000
    },
    {
      "producto_id": 2,
      "nombre": "Bolígrafo",
      "cantidad": 1,
      "precio_unitario": 2500,
      "subtotal": 2500
    }
  ]
}
```

### Ejemplo de Respuesta de Rechazo (`400 Bad Request`)
```json
{
  "error": "El producto con id 999 no existe en el catálogo."
}
```