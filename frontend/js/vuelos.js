// Flight booking functionality - Visual only (no cart functionality)
class FlightBooking {
  constructor() {
    this.flightListContainer = document.querySelector("#flightResults") || document.body;
  }

  async init() {
    await this.cargarVuelos();
    this.createParticles();
    this.revealOnScroll();
  }

  // Cargar vuelos desde la API y mostrarlos
  async cargarVuelos() {
    try {
      const res = await fetch('/api/products/vuelos');
      if (!res.ok) throw new Error('No se pudieron cargar los vuelos');
      const vuelos = await res.json();
      this.renderVuelos(vuelos);
    } catch (err) {
      this.flightListContainer.innerHTML = `<p style="color:red;">Error al cargar vuelos</p>`;
    }
  }

  // Renderizar vuelos en el DOM
  renderVuelos(vuelos) {
    if (!Array.isArray(vuelos) || vuelos.length === 0) {
      this.flightListContainer.innerHTML = '<p>No hay vuelos disponibles.</p>';
      return;
    }
    this.flightListContainer.innerHTML = vuelos.map(vuelo => {
      const pasaje = vuelo.pasaje || {};
      const tipoAsiento = pasaje.tipoAsiento ? pasaje.tipoAsiento.nombre : 'No especificado';
      const descripcionAsiento = pasaje.tipoAsiento ? pasaje.tipoAsiento.descripcion : '';
      return `
        <div class="flight-card">
          <div class="flight-info">
            <h3 class="flight-destination">${pasaje.destino || 'Destino'}</h3>
            <p class="flight-details">Aerolínea: <b>${pasaje.aerolinea || 'No especificada'}</b></p>
            <p class="flight-details">Salida: ${pasaje.origen || 'Origen'}${pasaje.fecha_salida ? ' - ' + new Date(pasaje.fecha_salida).toLocaleString() : ''}</p>
            <p class="flight-details">Llegada: ${pasaje.destino || 'Destino'}${pasaje.fecha_regreso ? ' - ' + new Date(pasaje.fecha_regreso).toLocaleString() : ''}</p>
            <p class="flight-details">Clase: ${pasaje.clase || 'Turista'}</p>
            <p class="flight-details">Tipo de asiento: ${tipoAsiento} ${descripcionAsiento ? '(' + descripcionAsiento + ')' : ''}</p>
            <p class="flight-details">Descripción: ${vuelo.descripcion || 'Sin descripción'}</p>
            <p class="flight-price">Precio: $${vuelo.precio}</p>
          </div>
          <button 
            class="add-to-cart-btn"
            data-id="${vuelo.id_producto}"
            data-tipo="vuelo"
            data-nombre="${vuelo.nombre}"
            data-precio="${vuelo.precio}"
          >
            Comprar
          </button>
          <button class="btn-personalizar-vuelo" data-id-producto="${vuelo.id_producto}" data-nombre="${vuelo.nombre}" data-precio-base="${vuelo.precio}">
            Personalizar y Añadir
          </button>
        </div>
      `;
    }).join('');
  }

  // Create animated background particles
  createParticles() {
    const bgAnimation = document.getElementById("bgAnimation")
    if (!bgAnimation) return;
    const particleCount = 20

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div")
      particle.className = "particle"
      particle.style.left = Math.random() * 100 + "%"
      particle.style.top = Math.random() * 100 + "%"
      particle.style.width = Math.random() * 10 + 5 + "px"
      particle.style.height = particle.style.width
      particle.style.animationDelay = Math.random() * 6 + "s"
      particle.style.animationDuration = Math.random() * 3 + 3 + "s"
      bgAnimation.appendChild(particle)
    }
  }

  // Scroll reveal animation
  revealOnScroll() {
    const reveals = document.querySelectorAll(".scroll-reveal")
    reveals.forEach((element) => {
      const windowHeight = window.innerHeight
      const elementTop = element.getBoundingClientRect().top
      const elementVisible = 150
      if (elementTop < windowHeight - elementVisible) {
        element.classList.add("revealed")
      }
    })
  }
}

// Notificación visual (como en login/dashboard)
function showNotification(message, type = 'info', duration = 3500) {
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${getNotificationIcon(type)}"></i>
    <span>${message}</span>
    <button class="notification-close" aria-label="Cerrar mensaje">
      <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(notification);
  setTimeout(() => closeNotification(notification), duration);
  notification.querySelector('.notification-close').onclick = () => closeNotification(notification);
}
function closeNotification(notification) {
  if (notification && notification.parentNode) {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) notification.remove();
    }, 300);
  }
}
function getNotificationIcon(type) {
  const icons = {
    success: 'check-circle',
    error: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  };
  return icons[type] || 'info-circle';
}

// Inicializar
let flightBooking;
document.addEventListener("DOMContentLoaded", () => {
  flightBooking = new FlightBooking();
  flightBooking.init();
});

// Evento global para agregar al carrito (visual, sin alert)
document.addEventListener('click', async function(e) {
  const btn = e.target.closest('.add-to-cart-btn');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const token = localStorage.getItem('token');
  if (!token) {
    showNotification('Debes iniciar sesión para agregar al carrito', 'error');
    setTimeout(() => window.location.href = 'login.html', 1800);
    return;
  }
  try {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId: Number(id), cantidad: 1 })
    });
    if (res.ok) {
      showNotification('Vuelo agregado al carrito', 'success');
    } else {
      const data = await res.json();
      showNotification(data.message || 'Error al agregar al carrito', 'error');
    }
  } catch (err) {
    showNotification('Error de red', 'error');
  }
});

// Variables globales para el modal
let vueloSeleccionado = null;
let claseSeleccionada = null;
let asientoSeleccionado = null;
let equipajeSeleccionado = [];
let precioBaseVuelo = 0;
let precioAsiento = 0;
let multiplicadorClase = 1;

// Abrir modal al hacer clic en "Personalizar y Añadir"
document.addEventListener('click', async function(e) {
  if (e.target.classList.contains('btn-personalizar-vuelo')) {
    const botonPersonalizar = e.target; // El botón que disparó el evento
    // const flightCard = botonPersonalizar.closest('.flight-card'); // Si se necesitaran datos del contenedor principal

    // Los data-attributes están directamente en el botón
    if (!botonPersonalizar.dataset.idProducto || !botonPersonalizar.dataset.nombre || !botonPersonalizar.dataset.precioBase) {
        console.error('Faltan data-attributes en el botón de personalizar.', botonPersonalizar);
        showNotification('Error al obtener datos del vuelo para personalizar.', 'error');
        return;
    }

    vueloSeleccionado = {
      id_producto: botonPersonalizar.dataset.idProducto,
      nombre: botonPersonalizar.dataset.nombre,
      precio: parseFloat(botonPersonalizar.dataset.precioBase)
    };
    precioBaseVuelo = vueloSeleccionado.precio;
    document.getElementById('modalTituloVuelo').textContent = `Personalizar: ${vueloSeleccionado.nombre}`;
    document.getElementById('modalPrecioBaseVuelo').textContent = precioBaseVuelo.toFixed(2);

    // Cargar clases, asientos y equipaje
    await cargarClasesServicio();
    await cargarMapaAsientos();
    await cargarOpcionesEquipaje();

    recalcularPrecioTotalModal();
    document.getElementById('vueloOpcionesModal').style.display = 'block';
  }
});

// Funciones para cargar datos y renderizar (deberás implementarlas)
// async function cargarClasesServicio() { /* ... */ }
// async function cargarMapaAsientos() { /* ... */ }
// async function cargarOpcionesEquipaje() { /* ... */ }
// function recalcularPrecioTotalModal() { /* ... */ }


// Variables globales para el modal (ya existentes y algunas nuevas)
// let vueloSeleccionado = null; (ya existe)
// let claseSeleccionada = null; (ya existe)
// let asientoSeleccionado = null; (ya existe)
// let equipajeSeleccionado = []; (ya existe)
// let precioBaseVuelo = 0; (ya existe)
// let precioAsiento = 0; (ya existe)
// let multiplicadorClase = 1; (ya existe)

let todasLasClasesServicio = [];
let todasLasOpcionesEquipaje = [];
let configuracionAvionActual = null;

async function cargarClasesServicio() {
  console.log('[vuelos.js] Iniciando cargarClasesServicio');
  const selector = document.getElementById('modalClaseServicioSelect'); // ID CORREGIDO
  if (!selector) {
    console.error("[vuelos.js] Elemento #modalClaseServicioSelect no encontrado.");
    return;
  }
  selector.innerHTML = '<option value="">Cargando clases...</option>';
  selector.disabled = true;
  try {
    const url = '/api/products/clases-servicio';
    console.log(`[vuelos.js] Fetching clases de servicio desde: ${url}`);
    const response = await fetch(url);
    const responseText = await response.text();
    console.log(`[vuelos.js] Respuesta cruda de clases-servicio (status ${response.status}): ${responseText}`);

    if (!response.ok) throw new Error(`HTTP ${response.status}: No se pudieron cargar las clases de servicio. Detalle: ${responseText}`);

    todasLasClasesServicio = JSON.parse(responseText);
    console.log('[vuelos.js] Clases de servicio parseadas:', todasLasClasesServicio);

    if (!Array.isArray(todasLasClasesServicio)) {
        throw new Error("La respuesta de clases de servicio no es un array.");
    }

    selector.innerHTML = '<option value="">Selecciona una clase</option>';
    todasLasClasesServicio.forEach(clase => {
      const option = document.createElement('option');
      option.value = clase.id_tipo_asiento;
      option.textContent = `${clase.nombre} (x${clase.multiplicador_precio})`;
      option.dataset.multiplicador = clase.multiplicador_precio;
      option.dataset.nombre = clase.nombre;
      selector.appendChild(option);
    });
    selector.disabled = false;
    console.log('[vuelos.js] Clases de servicio renderizadas en el select.');

    selector.removeEventListener('change', handleClaseChange);
    selector.addEventListener('change', handleClaseChange);

  } catch (error) {
    console.error('[vuelos.js] Error cargando clases de servicio:', error);
    selector.innerHTML = `<option value="">Error: ${error.message}</option>`;
    showNotification(error.message || 'Error al cargar clases de servicio.', 'error');
  }
}

function handleClaseChange() {
    console.log('[vuelos.js] handleClaseChange disparado');
    const selector = document.getElementById('modalClaseServicioSelect'); // ID CORREGIDO
    const selectedOption = selector.options[selector.selectedIndex];
    if (selectedOption && selectedOption.value) {
      claseSeleccionada = {
        id: parseInt(selectedOption.value),
        nombre: selectedOption.dataset.nombre,
        multiplicador: parseFloat(selectedOption.dataset.multiplicador)
      };
      multiplicadorClase = claseSeleccionada.multiplicador;
      console.log('[vuelos.js] Clase seleccionada:', claseSeleccionada);
    } else {
      claseSeleccionada = null;
      multiplicadorClase = 1;
      console.log('[vuelos.js] Ninguna clase seleccionada.');
    }
    recalcularPrecioTotalModal();
}

async function cargarMapaAsientos() {
  console.log('[vuelos.js] Iniciando cargarMapaAsientos');
  const container = document.getElementById('modalMapaAsientosContainer'); // ID CORREGIDO
  const infoSeleccion = document.getElementById('modalAsientoSeleccionado');
  const costoAdicionalInfo = document.getElementById('modalCostoAsiento'); // ID CORREGIDO

  if (!container) { console.error("[vuelos.js] Elemento #modalMapaAsientosContainer no encontrado."); return; }
  if (!infoSeleccion) { console.error("[vuelos.js] Elemento #modalAsientoSeleccionado no encontrado."); return; }
  if (!costoAdicionalInfo) { console.error("[vuelos.js] Elemento #modalCostoAsiento no encontrado."); return; }

  container.innerHTML = 'Cargando mapa de asientos...';
  infoSeleccion.textContent = 'Ninguno';
  costoAdicionalInfo.textContent = '0.00'; // No poner el $ aquí, solo el número
  asientoSeleccionado = null;
  precioAsiento = 0;

  if (!vueloSeleccionado || !vueloSeleccionado.id_producto) {
    console.error('[vuelos.js] No hay vuelo seleccionado para cargar mapa de asientos.');
    container.innerHTML = '<p>Error: No se ha seleccionado un vuelo para personalizar.</p>';
    return;
  }
  console.log('[vuelos.js] Vuelo seleccionado para mapa:', vueloSeleccionado);

  try {
    const url = `/api/products/pasajes/${vueloSeleccionado.id_producto}/mapa-asientos`;
    console.log(`[vuelos.js] Fetching mapa de asientos desde: ${url}`);
    const response = await fetch(url);
    const responseText = await response.text();
    console.log(`[vuelos.js] Respuesta cruda de mapa-asientos (status ${response.status}): ${responseText}`);

    if (!response.ok) {
      const errorData = JSON.parse(responseText || "{}");
      const defaultMessage = `Error ${response.status} al cargar el mapa de asientos.`;
      if (response.status === 404) {
         throw new Error(errorData.message || 'Mapa de asientos no disponible (verifique config de avión en BD).');
      }
      throw new Error(errorData.message || defaultMessage);
    }
    configuracionAvionActual = JSON.parse(responseText);
    console.log('[vuelos.js] Mapa de asientos parseado:', configuracionAvionActual);

    if (!configuracionAvionActual || !configuracionAvionActual.asientosConDisponibilidad || configuracionAvionActual.asientosConDisponibilidad.length === 0) {
      container.innerHTML = '<p>No hay asientos definidos o disponibles para este avión.</p>';
      console.log('[vuelos.js] No hay asientos definidos/disponibles.');
      return;
    }

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'asientos-grid';

    const filas = {};
    configuracionAvionActual.asientosConDisponibilidad.forEach(asiento => {
        if (!filas[asiento.fila]) filas[asiento.fila] = [];
        filas[asiento.fila].push(asiento);
    });
    console.log('[vuelos.js] Asientos agrupados por filas:', filas);

    for (const numFila in filas) {
        const filaDiv = document.createElement('div');
        filaDiv.className = 'asiento-fila';
        const labelFila = document.createElement('span');
        labelFila.className = 'fila-label';
        labelFila.textContent = `Fila ${numFila}`;
        filaDiv.appendChild(labelFila);

        filas[numFila].sort((a, b) => a.columna.localeCompare(b.columna)).forEach(asiento => {
            const asientoBtn = document.createElement('button');
            asientoBtn.className = 'asiento-btn';
            asientoBtn.textContent = `${asiento.columna}`;
            asientoBtn.dataset.idAsiento = asiento.id_asiento;
            asientoBtn.dataset.precioAdicional = asiento.precio_adicional_base || 0;
            asientoBtn.disabled = !asiento.disponible;

            asientoBtn.title = `Asiento ${numFila}${asiento.columna}`;
            if (!asiento.disponible) {
                asientoBtn.classList.add('ocupado');
                asientoBtn.title += ' (Ocupado)';
            } else {
                 asientoBtn.title += ` - $${(asiento.precio_adicional_base || 0).toFixed(2)} extra`;
            }

            asientoBtn.addEventListener('click', function() {
                console.log('[vuelos.js] Clic en asiento:', asiento);
                const actualSeleccionadoDOM = container.querySelector('.asiento-btn.seleccionado');
                if (actualSeleccionadoDOM) {
                    actualSeleccionadoDOM.classList.remove('seleccionado');
                }

                if (asientoSeleccionado && asientoSeleccionado.id === parseInt(asiento.id_asiento)) {
                    asientoSeleccionado = null;
                    precioAsiento = 0;
                    infoSeleccion.textContent = 'Ninguno';
                    console.log('[vuelos.js] Asiento deseleccionado.');
                } else {
                    this.classList.add('seleccionado');
                    asientoSeleccionado = {
                        id: parseInt(asiento.id_asiento),
                        display: `${numFila}${asiento.columna}`,
                        precio: parseFloat(this.dataset.precioAdicional)
                    };
                    precioAsiento = asientoSeleccionado.precio;
                    infoSeleccion.textContent = asientoSeleccionado.display;
                    console.log('[vuelos.js] Asiento seleccionado:', asientoSeleccionado);
                }
                costoAdicionalInfo.textContent = precioAsiento.toFixed(2); // No poner el $ aquí
                recalcularPrecioTotalModal();
            });
            filaDiv.appendChild(asientoBtn);
        });
        grid.appendChild(filaDiv);
    }
    container.appendChild(grid);
    console.log('[vuelos.js] Mapa de asientos renderizado.');

  } catch (error) {
    console.error('[vuelos.js] Error cargando mapa de asientos:', error);
    container.innerHTML = `<p style="color:red;">${error.message}</p>`;
    showNotification(error.message || 'Error al cargar el mapa de asientos.', 'error');
  }
}

async function cargarOpcionesEquipaje() {
  console.log('[vuelos.js] Iniciando cargarOpcionesEquipaje');
  const container = document.getElementById('modalOpcionesEquipajeContainer'); // ID CORREGIDO
   if (!container) { console.error("[vuelos.js] Elemento #modalOpcionesEquipajeContainer no encontrado."); return;}
  container.innerHTML = 'Cargando opciones de equipaje...';
  equipajeSeleccionado = [];

  try {
    const url = '/api/products/opciones-equipaje';
    console.log(`[vuelos.js] Fetching opciones de equipaje desde: ${url}`);
    const response = await fetch(url);
    const responseText = await response.text();
    console.log(`[vuelos.js] Respuesta cruda de opciones-equipaje (status ${response.status}): ${responseText}`);

    if (!response.ok) throw new Error(`HTTP ${response.status}: No se pudieron cargar las opciones de equipaje. Detalle: ${responseText}`);

    todasLasOpcionesEquipaje = JSON.parse(responseText);
    console.log('[vuelos.js] Opciones de equipaje parseadas:', todasLasOpcionesEquipaje);

    if (!Array.isArray(todasLasOpcionesEquipaje)) {
        throw new Error("La respuesta de opciones de equipaje no es un array.");
    }

    if (todasLasOpcionesEquipaje.length === 0) {
        container.innerHTML = '<p>No hay opciones de equipaje adicionales disponibles.</p>';
        console.log('[vuelos.js] No hay opciones de equipaje adicionales.');
        return;
    }

    container.innerHTML = '';
    todasLasOpcionesEquipaje.forEach(opcion => {
      const div = document.createElement('div');
      div.className = 'equipaje-opcion';
      div.innerHTML = `
        <label>
          <input type="checkbox" data-id-opcion="${opcion.id_opcion_equipaje}" data-precio="${opcion.precio_adicional}" data-nombre="${opcion.nombre}">
          ${opcion.nombre} (${opcion.descripcion || ''}) - $${parseFloat(opcion.precio_adicional).toFixed(2)}
        </label>
        <input type="number" value="1" min="1" max="5" class="equipaje-cantidad" style="display:none;" data-id-opcion-cantidad="${opcion.id_opcion_equipaje}">
      `;
      container.appendChild(div);

      const checkbox = div.querySelector('input[type="checkbox"]');
      const cantidadInput = div.querySelector('.equipaje-cantidad');

      checkbox.addEventListener('change', function() {
        console.log(`[vuelos.js] Checkbox equipaje '${opcion.nombre}' cambiado: ${this.checked}`);
        cantidadInput.style.display = this.checked ? 'inline-block' : 'none';
        actualizarSeleccionEquipaje(
            parseInt(opcion.id_opcion_equipaje),
            this.checked,
            parseInt(cantidadInput.value),
            parseFloat(this.dataset.precio),
            this.dataset.nombre
        );
      });
      cantidadInput.addEventListener('change', function() {
         console.log(`[vuelos.js] Cantidad equipaje '${opcion.nombre}' cambiada: ${this.value}`);
         if (checkbox.checked) {
            actualizarSeleccionEquipaje(
                parseInt(opcion.id_opcion_equipaje),
                true,
                parseInt(this.value),
                parseFloat(checkbox.dataset.precio),
                checkbox.dataset.nombre
            );
         }
      });
    });
    console.log('[vuelos.js] Opciones de equipaje renderizadas.');
  } catch (error) {
    console.error('[vuelos.js] Error cargando opciones de equipaje:', error);
    container.innerHTML = `<p style="color:red;">Error al cargar opciones de equipaje: ${error.message}</p>`;
    showNotification(error.message || 'Error al cargar opciones de equipaje.', 'error');
  }
}

function actualizarSeleccionEquipaje(idOpcion, seleccionado, cantidad, precioUnitario, nombreOpcion) {
    const indiceExistente = equipajeSeleccionado.findIndex(eq => eq.id === idOpcion);
    if (seleccionado) {
        if (indiceExistente > -1) {
            equipajeSeleccionado[indiceExistente].cantidad = cantidad;
            equipajeSeleccionado[indiceExistente].precioTotal = precioUnitario * cantidad;
        } else {
            equipajeSeleccionado.push({
                id: idOpcion,
                nombre: nombreOpcion,
                cantidad: cantidad,
                precioUnitario: precioUnitario,
                precioTotal: precioUnitario * cantidad
            });
        }
    } else {
        if (indiceExistente > -1) {
            equipajeSeleccionado.splice(indiceExistente, 1);
        }
    }
    console.log('[vuelos.js] Selección de equipaje actualizada:', equipajeSeleccionado);
    recalcularPrecioTotalModal();
}

function recalcularPrecioTotalModal() {
  const precioBaseElem = document.getElementById('modalPrecioBaseVuelo');
  const precioTotalEstimadoElem = document.getElementById('modalPrecioTotalEstimado'); // ID CORREGIDO

  if (!precioBaseElem || !precioTotalEstimadoElem) {
      console.warn("[vuelos.js] Elementos de precio no encontrados en el modal para recalcular.");
      return;
  }

  const precioBase = parseFloat(precioBaseElem.textContent) || 0;
  const costoClase = precioBase * (multiplicadorClase - 1);
  const costoAsiento = precioAsiento || 0;

  let costoEquipaje = 0;
  equipajeSeleccionado.forEach(eq => {
    costoEquipaje += eq.precioTotal;
  });

  const precioTotalEstimado = precioBase + costoClase + costoAsiento + costoEquipaje;

  console.log(`[vuelos.js] Recalculando precio: Base=${precioBase}, MultiplicadorClase=${multiplicadorClase}, CostoClase=${costoClase}, CostoAsiento=${costoAsiento}, CostoEquipaje=${costoEquipaje}, Total=${precioTotalEstimado}`);
  precioTotalEstimadoElem.textContent = precioTotalEstimado.toFixed(2); // No poner el $ aquí
}

// Asegurarse de resetear estado del modal al cerrarlo
// Quitar el onclick en línea del HTML: <span class="close-button" onclick="document.getElementById('vueloOpcionesModal').style.display='none'">&times;</span>
// Y usar solo este event listener:
const modalInstance = document.getElementById('vueloOpcionesModal');
const spanClose = modalInstance ? modalInstance.querySelector('.close-button') : null;

if (spanClose) {
    spanClose.addEventListener('click', function() {
        console.log('[vuelos.js] Botón de cierre del modal clickeado.');
        if(modalInstance) modalInstance.style.display = 'none';
        resetearEstadoModalVuelo();
    });
} else {
    console.warn("[vuelos.js] Botón de cierre (.close-button) no encontrado dentro de #vueloOpcionesModal.");
}

// Cerrar modal si se hace clic fuera de él
if (modalInstance) {
    modalInstance.addEventListener('click', function(event) {
        if (event.target === modalInstance) {
            console.log('[vuelos.js] Clic fuera del contenido del modal.');
            modalInstance.style.display = 'none';
            resetearEstadoModalVuelo();
        }
    });
}


function resetearEstadoModalVuelo() {
    console.log('[vuelos.js] Reseteando estado del modal de vuelo.');
    vueloSeleccionado = null;
    claseSeleccionada = null;
    asientoSeleccionado = null;
    equipajeSeleccionado = [];
    precioBaseVuelo = 0;
    precioAsiento = 0;
    multiplicadorClase = 1;

    const selectorClase = document.getElementById('modalClaseServicioSelect'); // ID CORREGIDO
    if (selectorClase) selectorClase.innerHTML = '<option value="">Selecciona una clase</option>';

    const asientosContainer = document.getElementById('modalMapaAsientosContainer'); // ID CORREGIDO
    if (asientosContainer) asientosContainer.innerHTML = 'Cargando mapa de asientos...';

    const equipajeContainer = document.getElementById('modalOpcionesEquipajeContainer'); // ID CORREGIDO
    if (equipajeContainer) equipajeContainer.innerHTML = 'Cargando opciones de equipaje...';

    const modalAsientoSel = document.getElementById('modalAsientoSeleccionado');
    if(modalAsientoSel) modalAsientoSel.textContent = 'Ninguno';

    const modalCostoAdAs = document.getElementById('modalCostoAsiento'); // ID CORREGIDO
    if(modalCostoAdAs) modalCostoAdAs.textContent = '0.00';

    const modalPrecioBase = document.getElementById('modalPrecioBaseVuelo');
    if(modalPrecioBase) modalPrecioBase.textContent = '0.00';

    const modalPrecioTotal = document.getElementById('modalPrecioTotalEstimado'); // ID CORREGIDO
    if(modalPrecioTotal) modalPrecioTotal.textContent = '0.00';
    console.log('[vuelos.js] Estado del modal reseteado.');
}


// Confirmar y añadir al carrito
document.getElementById('modalConfirmarBtn').addEventListener('click', async function() {
  const token = localStorage.getItem('token');
  if (!token) {
    showNotification('Debes iniciar sesión para agregar al carrito', 'error');
    setTimeout(() => window.location.href = 'login.html', 1800);
    return;
  }
  // Recopilar detalles seleccionados
  const detallesVuelo = {
    seleccion_clase_servicio_id: claseSeleccionada ? claseSeleccionada.id : null,
    seleccion_asiento_fisico_id: asientoSeleccionado ? asientoSeleccionado.id : null,
    selecciones_equipaje: Array.isArray(equipajeSeleccionado) ? equipajeSeleccionado.map(eq => ({
      id_opcion_equipaje: eq.id,
      cantidad: eq.cantidad
    })) : []
  };
  const datosParaCarrito = {
    productId: vueloSeleccionado.id_producto,
    cantidad: 1,
    detallesVuelo
  };
  try {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datosParaCarrito)
    });
    if (res.ok) {
      showNotification('Vuelo personalizado agregado al carrito', 'success');
      document.getElementById('vueloOpcionesModal').style.display = 'none';
    } else {
      const data = await res.json();
      showNotification(data.message || 'Error al agregar al carrito', 'error');
    }
  } catch (err) {
    showNotification('Error de red', 'error');
  }
});
