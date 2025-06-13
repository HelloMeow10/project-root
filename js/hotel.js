// Hotel booking functionality - ahora con datos reales y carrito
class HotelBooking {
  constructor() {
    this.currentHotel = null;
    this.hoteles = [];
    this.init();
  }

  async init() {
    this.createParticles();
    this.setupEventListeners();
    this.setupDateValidation();
    await this.cargarHoteles();
    this.revealOnScroll();
  }

  async cargarHoteles() {
    try {
      const res = await fetch('/api/products/hoteles');
      if (!res.ok) throw new Error('No se pudieron cargar los hoteles');
      const hoteles = await res.json();
      this.hoteles = hoteles;
      this.renderHoteles(hoteles);
    } catch (error) {
      const resultsContainer = document.getElementById("hotelResults");
      resultsContainer.innerHTML = `<div style="text-align: center; padding: 3rem; color:red;">Error al cargar hoteles</div>`;
    }
  }

  renderHoteles(hoteles) {
    const resultsContainer = document.getElementById("hotelResults");
    resultsContainer.innerHTML = '';

    if (!hoteles.length) {
      resultsContainer.innerHTML = `<div style="text-align: center; padding: 3rem;">No hay hoteles disponibles.</div>`;
      return;
    }

    hoteles.forEach(hotel => {
      const card = document.createElement('div');
      card.className = 'hotel-card';
      card.innerHTML = `
        <div class="hotel-content">
          <h3 class="hotel-name">${hotel.nombre}</h3>
          <div class="hotel-location">
            📍 ${hotel.hospedaje?.ubicacion || "Ubicación no disponible"}
          </div>
          <div class="hotel-price-container">
            <div class="hotel-price">
              $${hotel.precio} <span class="hotel-price-night">/ noche</span>
            </div>
            <button 
              class="add-to-cart-btn"
              data-id="${hotel.id_producto}"
              data-tipo="hotel"
              data-nombre="${hotel.nombre}"
              data-precio="${hotel.precio}"
            >Comprar</button>
          </div>
        </div>
      `;
      resultsContainer.appendChild(card);
    });
  }

  // Create animated background particles
  createParticles() {
    const bgAnimation = document.getElementById("bgAnimation");
    if (!bgAnimation) return;
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = Math.random() * 100 + "%";
      particle.style.width = Math.random() * 10 + 5 + "px";
      particle.style.height = particle.style.width;
      particle.style.animationDelay = Math.random() * 6 + "s";
      particle.style.animationDuration = Math.random() * 3 + 3 + "s";
      bgAnimation.appendChild(particle);
    }
  }

  // Scroll reveal animation
  revealOnScroll() {
    const reveals = document.querySelectorAll(".scroll-reveal");
    reveals.forEach((element) => {
      const windowHeight = window.innerHeight;
      const elementTop = element.getBoundingClientRect().top;
      const elementVisible = 150;
      if (elementTop < windowHeight - elementVisible) {
        element.classList.add("revealed");
      }
    });
  }

  setupEventListeners() {
    // Puedes agregar aquí listeners para filtros, etc.
  }

  setupDateValidation() {
    // Puedes agregar aquí validación de fechas si tu UI lo requiere
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
let hotelBooking;
document.addEventListener("DOMContentLoaded", () => {
  hotelBooking = new HotelBooking();
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
      showNotification('Hotel agregado al carrito', 'success');
    } else {
      const data = await res.json();
      showNotification(data.message || 'Error al agregar al carrito', 'error');
    }
  } catch (err) {
    showNotification('Error de red', 'error');
  }
});
