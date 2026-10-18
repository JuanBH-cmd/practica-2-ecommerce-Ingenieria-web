# Primera versión de una tienda web — Tienda de Aula (Práctica 20 %)

## 1. Información General
- **Nombre de la tienda:** Tienda de aula
- **Propósito de la tienda:** Plataforma web académica de comercio electrónico que permite a los estudiantes consultar un catálogo de útiles de estudio, organizar un carrito de compras con cálculo de subtotales y total provisional, registrar pedidos simulados validados y calculados en el servidor, y consultar el historial de pedidos persistidos en SQLite.
- **Integrante:** Juan Camilo Bedoya Holguin (Modalidad individual — 100 % de los aportes en diseño OOHDM, backend MVC, API HTTP, frontend y pruebas).
- **Asignatura:** Ingeniería Web — Programa de Ingeniería de Software
- **Docente:** Luis Miguel Gómez Meneses
- **Institución:** Universidad Cooperativa de Colombia

---

## 2. Requisitos, Instalación, Arranque y Carga de Datos Iniciales

### Versiones requeridas
- **Node.js:** versión **`24.11.0` o superior** (el proyecto utiliza exclusivamente los módulos nativos `node:http`, `node:fs`, `node:path` y `node:sqlite`, sin dependencias externas).
- **Navegador web moderno:** Chrome, Edge o Firefox con soporte para `fetch()` y `localStorage`.

### Instalación y comando de arranque
1. Clonar el repositorio y ubicarse en la carpeta del proyecto:
   ```bash
   git clone [https://github.com/JuanBH-cmd/practica-2-ecommerce-Ingenieria-web.git](https://github.com/JuanBH-cmd/practica-2-ecommerce-Ingenieria-web.git)
   cd practica-2-ecommerce-Ingenieria-web
   ```
2. Iniciar el servidor ejecutando el comando de arranque:
   ```bash
   npm start
   ```
   *(También puede iniciarse directamente con `node server_rutas.js`).*
3. Abrir en el navegador la dirección local:
   - **`http://localhost:3000`**

### Forma de crear o cargar los datos iniciales
Al iniciar el servidor (`npm start`), el módulo de acceso a datos (`data/tiendaRepository.js`) realiza automáticamente las siguientes operaciones sin requerir pasos manuales adicionales:
1. Crea la carpeta `data/` y el archivo `data/tienda.db` si aún no existen (o utiliza la ruta indicada en la variable de entorno `TIENDA_DB_PATH`).
2. Ejecuta el script `data/esquema.sql`, el cual activa las claves foráneas (`PRAGMA foreign_keys = ON;`) y crea las tres tablas (`productos`, `pedidos` y `detalle_pedido`).
3. Siembra los **6 productos iniciales** del catálogo mediante una sentencia `INSERT OR IGNORE INTO productos` (*Cuaderno, Bolígrafo, Carpeta, Resaltador, Agenda y Estuche*), garantizando que los datos iniciales sean siempre reproducibles desde una copia limpia sin duplicarse al reiniciar.

---

## 3. Decisiones de Diseño y Reglas del Modelo

De acuerdo con los lineamientos de la práctica, se adoptaron y documentan las siguientes decisiones técnicas:

1. **Moneda y precios:** Todos los precios unitarios, subtotales y totales se manejan en **pesos colombianos enteros positivos (COP)**, evitando errores de redondeo en punto flotante.
2. **Conservación del carrito (`localStorage`):** Se eligió **`localStorage`** (bajo la clave `'carrito_tienda_aula'`) en lugar de `sessionStorage` para que la selección de productos del usuario se conserve al navegar entre las páginas `/`, `/carrito` y `/pedidos`, así como al recargar la pestaña. El carrito únicamente se vacía después de que el servidor confirma el registro exitoso del pedido con código HTTP `201`.
3. **Implementación de las tres vistas como páginas:** Las vistas se estructuraron como tres páginas HTML independientes servidas por el backend (`views/index.html` en `/`, `views/carrito.html` en `/carrito` y `views/pedidos.html` en `/pedidos`), conectadas mediante una barra de navegación común y scripts dedicados en `public/`.
4. **Tratamiento de productos repetidos en un pedido (Agrupación):** En el cliente (`public/catalogo.js`), agregar un producto que ya está en el carrito incrementa su cantidad. Adicionalmente, en el servidor (`models/tiendaModel.js`), si una solicitud `POST /api/pedidos` envía un mismo `producto_id` repetido en varias posiciones del arreglo `items`, **el modelo agrupa los ítems por `producto_id` sumando sus cantidades** mediante una estructura `Map` antes de consultar los precios y registrar los detalles.
5. **Datos del comprador y ejecución local:** Se utiliza información ficticia en ejecución local. Los datos del comprador (`nombre` y `correo`) se validan tras eliminar espacios exteriores (`.trim()`) y se almacenan directamente en la tabla `pedidos`.

---

## 4. Organización MVC en Capas

El proyecto separa estrictamente el arranque, el enrutamiento, el manejo HTTP, las reglas de negocio, el acceso a datos en SQLite y la interfaz de usuario:

```text
/
├── server_rutas.js              # Arranque: inicia el servidor HTTP, captura errores globales y cierra SQLite al terminar.
├── routes/
│   └── rutas.js                 # Enrutador: selecciona la acción del controlador según método HTTP y ruta.
├── controllers/
│   └── tiendaController.js      # Controlador HTTP: lee JSON (leerJson), verifica Content-Type y envía códigos HTTP y respuestas.
├── models/
│   └── tiendaModel.js           # Modelo (Lógica de negocio): valida comprador e ítems, agrupa repetidos y calcula totales con precios reales.
├── data/
│   ├── esquema.sql              # Esquema relacional de las tablas productos, pedidos y detalle_pedido.
│   ├── tiendaRepository.js      # Repositorio (Acceso a datos): conexión SQLite, consultas preparadas y función enTransaccion().
│   ├── tienda.db                # Archivo de base de datos SQLite (generado automáticamente al ejecutar).
│   └── LEEME.txt                # Nota sobre la carpeta de datos.
├── views/
│   ├── index.html               # Vista del catálogo de productos.
│   ├── carrito.html             # Vista del carrito, formulario del comprador y confirmación del pedido.
│   └── pedidos.html             # Vista de consulta de pedidos registrados.
├── public/
│   ├── catalogo.js              # Consumo de GET /api/productos y adición de ítems en localStorage.
│   ├── carrito.js               # Gestión del carrito, envío de POST /api/pedidos y renderizado de confirmación.
│   ├── pedidos.js               # Consumo de GET /api/pedidos y presentación de pedidos con sus detalles.
│   └── styles.css               # Hoja de estilos compartida.
└── docs/
    ├── OOHDM.md                 # Documentación de las 4 actividades de OOHDM y matriz de correspondencia.
    ├── CONTRATO_API.md          # Contrato detallado de la API HTTP.
    ├── PRUEBAS_Y_APORTES.md     # Evidencia de los 9 casos de aceptación, script de prueba y aportes.
    └── PLAN_DE_TRABAJO.md       # Guía de actividades del proyecto.
```

---

## 5. Documentación del Servicio Web (API HTTP)

### Justificación de la API HTTP orientada a recursos y comparación entre REST, SOAP y GraphQL
En esta tienda web se implementó una **API HTTP orientada a recursos** siguiendo los principios del estilo **REST**, ya que las entidades principales del dominio (`productos` y `pedidos`) se modelan naturalmente como colecciones identificadas mediante rutas uniformes (`/api/productos`, `/api/productos/:id`, `/api/pedidos`) sobre las cuales se aplican métodos estándar de HTTP (`GET` para consultar y `POST` para crear) intercambiando representaciones ligeras en formato JSON consumidas directamente por `fetch()` en el navegador. Este enfoque se diferencia de otras tecnologías vistas en el curso en su nivel y forma de operación: mientras **REST** es un *estilo de arquitectura* que aprovecha las direcciones, métodos y códigos de estado nativos de HTTP (y puede describirse opcionalmente con **OpenAPI**), **SOAP** es un *protocolo de mensajería* basado estrictamente en mensajes **XML** estructurados con `Envelope`, `Header`, `Body` y `Fault` (habitualmente enviados por `POST` y descritos mediante contratos **WSDL**), y **GraphQL** es un *lenguaje de consultas y sistema de ejecución* donde el cliente envía una consulta a un único endpoint seleccionando exactamente qué campos del esquema tipado desea recibir en la respuesta JSON.

### Tabla de Endpoints de la API

| Método y Ruta | Entrada | Salida | Códigos de Estado |
|---|---|---|---|
| `GET /api/productos` | Sin cuerpo. | Arreglo JSON de objetos `{ id, nombre, descripcion, precio }`. | `200 OK`, `500 Internal Server Error` |
| `GET /api/productos/:id` | Parámetro `:id` numérico en la URL. | Objeto JSON `{ id, nombre, descripcion, precio }` o `{ error }`. | `200 OK`, `404 Not Found` |
| `POST /api/pedidos` | Encabezado `Content-Type: application/json` y cuerpo `{ nombre, correo, items: [{ producto_id, cantidad }] }`. | Objeto JSON del pedido creado (`id`, `nombre`, `correo`, `fecha`, `total`, `items`) o `{ error }`. | `201 Created`, `400 Bad Request`, `413 Payload Too Large`, `415 Unsupported Media Type`, `500 Internal Server Error` |
| `GET /api/pedidos` | Sin cuerpo. | Arreglo JSON de pedidos con sus detalles `items` (o `[]` si no hay registros). | `200 OK`, `500 Internal Server Error` |

### Ejemplo JSON de Solicitud y Respuesta (`POST /api/pedidos`)

**Solicitud enviada por el cliente:**
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

**Respuesta devuelta por el servidor (`201 Created`):**
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

---

## 6. Casos Mínimos de Aceptación (Sección 9)

| Caso | Entrada o acción | Resultado esperado | Resultado observado | Evidencia |
|---|---|---|---|---|
| **1. Catálogo** | Abrir `/` en el navegador (`GET /api/productos`). | Muestra los 6 productos obtenidos por la API y `GET` responde `200` JSON. | Se presentan las 6 tarjetas con precios en COP y `GET /api/productos` responde `200 OK`. | Vista `/` y pestaña Red (`200`). |
| **2. Carrito** | Agregar 2 productos distintos, cambiar cantidad de uno, eliminar el otro y vaciar el carrito. | Actualiza subtotales y total provisional; al vaciarlo informa que está vacío. | Los subtotales y el total se recalculan en vivo y al vaciar muestra el mensaje de carrito vacío. | Vista `/carrito` y `localStorage`. |
| **3. Pedido válido** | Enviar pedido con 2 Cuadernos ($12.000) y 1 Bolígrafo ($2.500). | Responde `201`, total `26500` calculado por el servidor, 1 pedido y 2 detalles en SQLite. | Responde `201` con `total: 26500`, muestra confirmación, vacía carrito y persiste pedido y 2 detalles. | Confirmación en `/carrito` y vista `/pedidos`. |
| **4. Datos del comprador** | Enviar `nombre` o `correo` vacío en `POST /api/pedidos`. | Responde `400` con explicación y no crea registros nuevos. | Responde `400 Bad Request` indicando el campo obligatorio y no altera la base de datos. | Respuesta JSON `400` y consulta `/api/pedidos`. |
| **5. Carrito vacío** | Enviar `POST /api/pedidos` con `items: []`. | Responde `400` y ausencia de nuevos registros. | Responde `400` con `{"error":"El pedido debe incluir al menos un producto en items."}`. | Respuesta JSON `400` en consola/Red. |
| **6. Cantidad inválida** | Enviar cantidad `0`, `-2` o `1.5` directamente a `POST /api/pedidos`. | Rechazo en el servidor con código `400`. | Responde `400` con `{"error":"La cantidad de cada producto debe ser un número entero positivo."}`. | Prueba `fetch` directa a la API (`400`). |
| **7. Producto inválido** | Enviar `producto_id: 999` junto con `producto_id: 1` válido. | Responde `400` y no quedan pedido ni detalles parciales. | Responde `400` (`"El producto con id 999 no existe en el catálogo."`) sin registros parciales. | Prueba `fetch` (`400`) y verificación en SQLite. |
| **8. Total alterado** | Enviar `total: 50` y `precio: 1` en el JSON de un pedido de 2 Cuadernos. | El servidor ignora los valores enviados y calcula `24000` con los precios de SQLite. | Responde `201` con `precio_unitario: 12000` y `total: 24000` tomados de la base de datos. | Respuesta `201` verificada en consola/Red. |
| **9. Persistencia** | Registrar pedido, reiniciar servidor (`Ctrl+C` y `npm start`), consultar `/pedidos` y `/api/productos/999`. | Los pedidos siguen disponibles con sus detalles tras reiniciar; el producto inexistente responde `404`. | La vista `/pedidos` conserva los pedidos tras el reinicio y `/api/productos/999` responde `404`. | Vista `/pedidos` tras reinicio y `404` en `/api/productos/999`. |

---

## 7. Enlaces a la Documentación en `docs/`
- 📐 **[Aplicación de la Metodología OOHDM y Arquitectura (`docs/OOHDM.md`)](docs/OOHDM.md)**
- 🔌 **[Contrato Detallado de la API (`docs/CONTRATO_API.md`)](docs/CONTRATO_API.md)**
- 🧪 **[Evidencias de Pruebas, Script de Consola y Aportes (`docs/PRUEBAS_Y_APORTES.md`)](docs/PRUEBAS_Y_APORTES.md)**