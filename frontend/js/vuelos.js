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

// Código del servidor (por ejemplo, usando Express y Prisma)
app.get('/api/products/vuelos', async (req, res) => {
  try {
    const vuelos = await prisma.producto.findMany({
      where: {
        // tu filtro para vuelos, por ejemplo:
        tipoProducto: { nombre: 'vuelo' }
      },
      include: {
        pasaje: {
          include: {
            tipoAsiento: true
          }
        }
      }
    });
    res.json(vuelos);
  } catch (error) {
    console.error('Error al obtener vuelos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});
