// Variables globales para el estado de la aplicación
let currentFilters = {
  category: "",
  maxPrice: 200,
  startDate: "",
  endDate: "",
}

let allCars = []
let filteredCars = []

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  // La navegación móvil ahora se maneja en shared-nav.js
})

// Función principal de inicialización
function initializeApp() {
  setupEventListeners()
  setMinDates()
  loadCars()
}

// Configurar todos los event listeners
function setupEventListeners() {
  // Navegación móvil eliminada de aquí, manejada por shared-nav.js

  // Formulario de búsqueda
  setupSearchForm()

  // Filtros
  setupFilters()

  // Modal
  setupModal()

  // Formulario de reserva
  setupBookingForm()
}

// Navegación móvil eliminada de aquí

// Configurar formulario de búsqueda
function setupSearchForm() {
  const searchForm = document.getElementById("searchForm")

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault()
      handleSearch()
    })
  }
}

// Configurar fechas mínimas
function setMinDates() {
  const today = new Date().toISOString().split("T")[0]
  const startDateInput = document.getElementById("startDate")
  const endDateInput = document.getElementById("endDate")

  if (startDateInput) {
    startDateInput.setAttribute("min", today)
    startDateInput.addEventListener("change", function () {
      if (endDateInput) {
        endDateInput.setAttribute("min", this.value)
        if (endDateInput.value && endDateInput.value < this.value) {
          endDateInput.value = this.value
        }
      }
    })
  }
}

// Configurar filtros
function setupFilters() {
  const categoryFilter = document.getElementById("categoryFilter")
  const priceFilter = document.getElementById("priceFilter")
  const priceValue = document.getElementById("priceValue")
  const clearFilters = document.getElementById("clearFilters")

  // Filtro de categoría
  if (categoryFilter) {
    categoryFilter.addEventListener("change", function () {
      currentFilters.category = this.value
      applyFilters()
    })
  }

  // Filtro de precio
  if (priceFilter && priceValue) {
    priceFilter.addEventListener("input", function () {
      currentFilters.maxPrice = Number.parseInt(this.value)
      priceValue.textContent = `$${this.value}`
      applyFilters()
    })
  }

  // Limpiar filtros
  if (clearFilters) {
    clearFilters.addEventListener("click", () => {
      clearAllFilters()
    })
  }
}

// Configurar modal
function setupModal() {
  const modal = document.getElementById("bookingModal")
  const closeBtn = document.getElementById("closeModal")
  const cancelBtn = document.getElementById("cancelBooking")

  // Cerrar modal
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeModal()
    })
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      closeModal()
    })
  }

  // Cerrar modal al hacer clic fuera
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal()
      }
    })
  }
}

// Configurar formulario de reserva
function setupBookingForm() {
  const bookingForm = document.getElementById("bookingForm")

  if (bookingForm) {
    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault()
      processBooking()
    })
  }
}

// Manejar búsqueda
function handleSearch() {
  const startDate = document.getElementById("startDate").value
  const endDate = document.getElementById("endDate").value

  if (!startDate || !endDate) {
    alert("Por favor selecciona las fechas de inicio y fin")
    return
  }

  currentFilters.startDate = startDate
  currentFilters.endDate = endDate

  // Scroll a la sección de autos
  document.getElementById("autos").scrollIntoView({ behavior: "smooth" })

  applyFilters()
}

// Cargar autos (simula llamada a API)
async function loadCars() {
  showLoading()

  try {
    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // En una aplicación real, aquí harías fetch a tu API
    // const response = await fetch('/api/cars');
    // allCars = await response.json();

    // Por ahora, los autos se cargarán desde la función que simula la API
    allCars = await fetchCarsFromAPI()
    filteredCars = [...allCars]

    renderCars()
    updateResultsCount()
  } catch (error) {
    console.error("Error cargando autos:", error)
    showNoResults()
  } finally {
    hideLoading()
  }
}

// Simular llamada a API (reemplazar con llamada real)
async function fetchCarsFromAPI() {
  // Ahora sí traemos los autos desde la API real
  try {
    const res = await fetch('/api/products/autos');
    if (!res.ok) throw new Error('No se pudieron cargar los autos');
    const autos = await res.json();
    // Normaliza los datos para que coincidan con el render actual
    return autos.map(auto => ({
      id: auto.id_producto,
      name: auto.nombre,
      category: auto.categoria || 'economico',
      price: auto.precio,
      image: auto.imagen || '/placeholder.svg?height=200&width=300',
      passengers: auto.pasajeros || 5,
      transmission: auto.transmision || 'Automática',
      fuel: auto.combustible || 'Gasolina',
      doors: auto.puertas || 4,
      featured: auto.destacado || false,
      // Puedes agregar más campos si tu API los devuelve
    }));
  } catch (err) {
    showNotification('Error al cargar autos', 'error');
    return [];
  }
}

// Aplicar filtros
function applyFilters() {
  filteredCars = allCars.filter((car) => {
    // Filtro por categoría
    if (currentFilters.category && car.category !== currentFilters.category) {
      return false
    }

    // Filtro por precio
    if (car.price > currentFilters.maxPrice) {
      return false
    }

    // Aquí puedes agregar más filtros según tus necesidades

    return true
  })

  renderCars()
  updateResultsCount()
}

// Limpiar todos los filtros
function clearAllFilters() {
  currentFilters = {
    category: "",
    maxPrice: 200,
    startDate: currentFilters.startDate, // Mantener fechas
    endDate: currentFilters.endDate,
  }

  // Resetear controles de UI
  const categoryFilter = document.getElementById("categoryFilter")
  const priceFilter = document.getElementById("priceFilter")
  const priceValue = document.getElementById("priceValue")

  if (categoryFilter) categoryFilter.value = ""
  if (priceFilter) priceFilter.value = "200"
  if (priceValue) priceValue.textContent = "$200"

  applyFilters()
}

// Renderizar autos
function renderCars() {
  const carsGrid = document.getElementById("carsGrid")
  const noResults = document.getElementById("noResults")

  if (!carsGrid) return

  if (filteredCars.length === 0) {
    carsGrid.style.display = "none"
    if (noResults) noResults.style.display = "block"
    return
  }

  if (noResults) noResults.style.display = "none"
  carsGrid.style.display = "grid"

  carsGrid.innerHTML = filteredCars.map((car) => createCarCard(car)).join("")
}

// Crear tarjeta de auto
function createCarCard(car) {
  return `
    <div class="car-card">
      <div class="car-image" style="background-image: url('${car.image || "/placeholder.svg?height=200&width=300"}')">
        ${car.featured ? '<div class="car-badge">Destacado</div>' : ""}
      </div>
      <div class="car-content">
        <div class="car-header">
          <div>
            <h3 class="car-title">${car.name || "Auto Disponible"}</h3>
            <p class="car-category">${getCategoryName(car.category)}</p>
          </div>
          <div class="car-price">$${car.price || "0"}</div>
        </div>
        <div class="car-features">
          <div class="car-feature">
            <i class="fas fa-users"></i>
            <span>${car.passengers || "N/A"} pasajeros</span>
          </div>
          <div class="car-feature">
            <i class="fas fa-cog"></i>
            <span>${car.transmission || "N/A"}</span>
          </div>
          <div class="car-feature">
            <i class="fas fa-gas-pump"></i>
            <span>${car.fuel || "N/A"}</span>
          </div>
          <div class="car-feature">
            <i class="fas fa-door-open"></i>
            <span>${car.doors || "N/A"} puertas</span>
          </div>
        </div>
        <div class="car-actions">
          <button class="btn-outline" onclick="viewCarDetails(${car.id})">Ver Detalles</button>
          <button class="btn-primary" onclick="bookCar(${car.id})">Reservar</button>
        </div>
      </div>
    </div>
  `
}

// Obtener nombre de categoría
function getCategoryName(category) {
  const categories = {
    economico: "Económico",
    compacto: "Compacto",
    suv: "SUV",
    lujo: "Lujo",
  }
  return categories[category] || "Categoría"
}

// Ver detalles del auto
function viewCarDetails(carId) {
  const car = allCars.find((c) => c.id === carId)
  if (car) {
    // Aquí puedes mostrar más detalles del auto
    // Por ejemplo, abrir un modal con información detallada
    alert(`Detalles de ${car.name}\nPrecio: $${car.price}/día\nCategoría: ${getCategoryName(car.category)}`)
  }
}

// Reservar auto (ahora agrega al carrito)
function bookCar(carId) {
  const car = allCars.find((c) => c.id === carId)
  if (!car) return

  // Si quieres mantener el flujo de fechas/modal, puedes dejar esto:
  // if (!currentFilters.startDate || !currentFilters.endDate) {
  //   alert("Por favor selecciona las fechas de alquiler primero")
  //   return
  // }

  // Nuevo: Agregar al carrito
  addToCart(car)
}

// Agregar auto al carrito (requiere login)
async function addToCart(car) {
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
      body: JSON.stringify({ productId: Number(car.id), cantidad: 1 })
    });
    if (res.ok) {
      showNotification('Auto agregado al carrito', 'success');
    } else {
      const data = await res.json();
      showNotification(data.message || 'Error al agregar al carrito', 'error');
    }
  } catch (err) {
    showNotification('Error de red', 'error');
  }
}

// Notificación visual (puedes copiar la de vuelos.js si no la tienes)
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

// Procesar reserva
async function processBooking() {
  const form = document.getElementById("bookingForm")
  const modal = document.getElementById("bookingModal")
  const submitBtn = form.querySelector('button[type="submit"]')

  if (!form || !modal) return

  // Obtener datos del formulario
  const formData = new FormData(form)
  const bookingData = {
    carId: modal.dataset.carId,
    customerName: formData.get("customerName") || document.getElementById("customerName").value,
    customerEmail: formData.get("customerEmail") || document.getElementById("customerEmail").value,
    customerPhone: formData.get("customerPhone") || document.getElementById("customerPhone").value,
    startDate: currentFilters.startDate,
    endDate: currentFilters.endDate,
    totalAmount: modal.dataset.totalAmount,
  }

  // Validar datos
  if (!bookingData.customerName || !bookingData.customerEmail || !bookingData.customerPhone) {
    alert("Por favor completa todos los campos")
    return
  }

  // Mostrar estado de carga
  const originalText = submitBtn.textContent
  submitBtn.textContent = "Procesando..."
  submitBtn.disabled = true

  try {
    // Simular envío a API
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // En una aplicación real, enviarías los datos a tu API:
    // const response = await fetch('/api/bookings', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(bookingData)
    // });

    // Simular respuesta exitosa
    alert("¡Reserva confirmada! Te enviaremos un email con los detalles.")
    closeModal()
    form.reset()
  } catch (error) {
    console.error("Error procesando reserva:", error)
    alert("Error al procesar la reserva. Por favor intenta de nuevo.")
  } finally {
    submitBtn.textContent = originalText
    submitBtn.disabled = false
  }
}

// Cerrar modal
function closeModal() {
  const modal = document.getElementById("bookingModal")
  if (modal) {
    modal.style.display = "none"
  }
}

// Mostrar estado de carga
function showLoading() {
  const loading = document.getElementById("loading")
  const carsGrid = document.getElementById("carsGrid")
  const noResults = document.getElementById("noResults")

  if (loading) loading.style.display = "flex"
  if (carsGrid) carsGrid.style.display = "none"
  if (noResults) noResults.style.display = "none"
}

// Ocultar estado de carga
function hideLoading() {
  const loading = document.getElementById("loading")
  if (loading) loading.style.display = "none"
}

// Mostrar sin resultados
function showNoResults() {
  const carsGrid = document.getElementById("carsGrid")
  const noResults = document.getElementById("noResults")

  if (carsGrid) carsGrid.style.display = "none"
  if (noResults) noResults.style.display = "block"
}

// Actualizar contador de resultados
function updateResultsCount() {
  const resultsCount = document.getElementById("resultsCount")
  if (resultsCount) {
    resultsCount.textContent = `${filteredCars.length} autos encontrados`
  }
}
