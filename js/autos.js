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
})

// Función principal de inicialización
function initializeApp() {
  setupEventListeners()
  setMinDates()
  loadCars()
}

// Configurar todos los event listeners
function setupEventListeners() {
  // Navegación móvil
  setupMobileNavigation()

  // Formulario de búsqueda
  setupSearchForm()

  // Filtros
  setupFilters()

  // Modal
  setupModal()

  // Formulario de reserva
  setupBookingForm()
}

// Navegación móvil
function setupMobileNavigation() {
  const navToggle = document.querySelector(".nav-toggle")
  const navMenu = document.querySelector(".nav-menu")

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active")

      // Animar el ícono hamburguesa
      const spans = navToggle.querySelectorAll("span")
      spans.forEach((span, index) => {
        if (navMenu.classList.contains("active")) {
          if (index === 0) span.style.transform = "rotate(45deg) translate(5px, 5px)"
          if (index === 1) span.style.opacity = "0"
          if (index === 2) span.style.transform = "rotate(-45deg) translate(7px, -6px)"
        } else {
          span.style.transform = "none"
          span.style.opacity = "1"
        }
      })
    })
  }
}

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
  // Esta función simula una respuesta de API
  // En producción, reemplazar con: return fetch('/api/cars').then(res => res.json())

  return new Promise((resolve) => {
    // Simular datos que vendrían de la base de datos
    const cars = [] // Array vacío - los datos vendrán de tu BD

    // Ejemplo de estructura que debería devolver tu API:
    /*
    const cars = [
      {
        id: 1,
        name: 'Toyota Corolla',
        category: 'economico',
        price: 35,
        image: '/images/toyota-corolla.jpg',
        passengers: 5,
        transmission: 'Automática',
        fuel: 'Gasolina',
        available: true
      }
    ];
    */

    resolve(cars)
  })
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

// Reservar auto
function bookCar(carId) {
  const car = allCars.find((c) => c.id === carId)
  if (!car) return

  if (!currentFilters.startDate || !currentFilters.endDate) {
    alert("Por favor selecciona las fechas de alquiler primero")
    return
  }

  showBookingModal(car)
}

// Mostrar modal de reserva
function showBookingModal(car) {
  const modal = document.getElementById("bookingModal")
  const carSummary = document.getElementById("carSummary")
  const totalAmount = document.getElementById("totalAmount")

  if (!modal || !carSummary || !totalAmount) return

  const days = calculateDays(currentFilters.startDate, currentFilters.endDate)
  const total = car.price * days

  carSummary.innerHTML = `
    <h4>${car.name}</h4>
    <div class="summary-item">
      <span>Fecha de inicio:</span>
      <span>${formatDate(currentFilters.startDate)}</span>
    </div>
    <div class="summary-item">
      <span>Fecha de fin:</span>
      <span>${formatDate(currentFilters.endDate)}</span>
    </div>
    <div class="summary-item">
      <span>Días:</span>
      <span>${days}</span>
    </div>
    <div class="summary-item">
      <span>Precio por día:</span>
      <span>$${car.price}</span>
    </div>
    <div class="summary-item">
      <span>Total:</span>
      <span>$${total}</span>
    </div>
  `

  totalAmount.textContent = `$${total}`

  // Guardar datos del auto para la reserva
  modal.dataset.carId = car.id
  modal.dataset.totalAmount = total

  modal.style.display = "block"
}

// Calcular días entre fechas
function calculateDays(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays || 1
}

// Formatear fecha
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
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
