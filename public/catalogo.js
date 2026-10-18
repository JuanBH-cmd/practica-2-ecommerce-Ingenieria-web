// Catálogo conectado con localStorage para agregar productos al carrito.
const estado = document.getElementById('estado');
const contenedor = document.getElementById('catalogo');
const CLAVE_CARRITO = 'carrito_tienda_aula';
const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

function leerCarrito() {
  try {
    const guardado = localStorage.getItem(CLAVE_CARRITO);
    const items = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function guardarCarrito(items) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
}

function agregarAlCarrito(producto) {
  const carrito = leerCarrito();
  const existente = carrito.find((item) => item.producto_id === producto.id);

  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1
    });
  }

  guardarCarrito(carrito);
  const totalUnidades = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  estado.textContent = `"${producto.nombre}" agregado al carrito. Total en carrito: ${totalUnidades} unidad(es).`;
}

async function cargarCatalogo() {
  try {
    const respuesta = await fetch('/api/productos');
    if (!respuesta.ok) throw new Error('No fue posible consultar el catálogo.');
    const productos = await respuesta.json();
    contenedor.replaceChildren();

    for (const producto of productos) {
      const tarjeta = document.createElement('article');
      tarjeta.className = 'producto';

      const nombre = document.createElement('h2');
      nombre.textContent = producto.nombre;

      const descripcion = document.createElement('p');
      descripcion.textContent = producto.descripcion;

      const precio = document.createElement('p');
      precio.className = 'precio';
      precio.textContent = moneda.format(producto.precio);

      const boton = document.createElement('button');
      boton.type = 'button';
      boton.textContent = 'Agregar al carrito';
      boton.addEventListener('click', () => agregarAlCarrito(producto));

      tarjeta.append(nombre, descripcion, precio, boton);
      contenedor.append(tarjeta);
    }

    estado.textContent = productos.length
      ? `${productos.length} productos disponibles.`
      : 'No hay productos disponibles.';
  } catch (error) {
    estado.textContent = error.message;
  }
}

cargarCatalogo();