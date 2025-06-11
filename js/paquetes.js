// DOM Elements
const filterBtns = document.querySelectorAll(".filter-btn")
const packageCards = document.querySelectorAll(".package-card")
const sortSelect = document.getElementById("sortSelect")
const searchInput = document.getElementById("searchInput")
const quickViewBtns = document.querySelectorAll(".quick-view-btn")
const bookBtns = document.querySelectorAll(".book-btn")
const modals = document.querySelectorAll(".modal")
const closeModalBtns = document.querySelectorAll(".close-modal")
const navToggle = document.querySelector(".nav-toggle")
const navMenu = document.querySelector(".nav-menu")
const bookingForm = document.getElementById("bookingForm")

// Package data for quick view and booking
const packageData = {
  maldives: {
    name: "Maldives Paradise",
    price: 1299,
    duration: 7,
    rating: 4.8,
    description: "7 days of luxury in overwater bungalows with all meals included",
    features: ["Flights included", "5-Star Resort", "All meals", "Water sports", "Spa access"],
    images: ["/placeholder.svg?height=300&width=500", "/placeholder.svg?height=300&width=500"],
    itinerary: [
      "Day 1: Arrival and welcome dinner",
      "Day 2-3: Water sports and relaxation",
      "Day 4-5: Island hopping tours",
      "Day 6: Spa day and sunset cruise",
      "Day 7: Departure",
    ],
  },
  swiss: {
    name: "Swiss Alps Adventure",
    price: 899,
    duration: 5,
    rating: 4.6,
    description: "5 days exploring the majestic Swiss Alps with guided tours",
    features: ["Flights included", "Mountain lodge", "Guided hiking", "Cable car rides", "Photography tours"],
    images: ["/placeholder.svg?height=300&width=500", "/placeholder.svg?height=300&width=500"],
    itinerary: [
      "Day 1: Arrival in Zurich",
      "Day 2: Jungfraujoch excursion",
      "Day 3: Hiking in Lauterbrunnen",
      "Day 4: Matterhorn visit",
      "Day 5: Departure",
    ],
  },
  tokyo: {
    name: "Tokyo Cultural Experience",
    price: 1599,
    duration: 6,
    rating: 4.9,
    description: "6 days immersing in Japanese culture and modern city life",
    features: ["Flights included", "Traditional ryokan", "Temple visits", "Food tours", "Cultural workshops"],
    images: ["/placeholder.svg?height=300&width=500", "/placeholder.svg?height=300&width=500"],
    itinerary: [
      "Day 1: Arrival and Shibuya exploration",
      "Day 2: Traditional temples and gardens",
      "Day 3: Food tour in Tsukiji",
      "Day 4: Mount Fuji day trip",
      "Day 5: Modern Tokyo and shopping",
      "Day 6: Departure",
    ],
  },
  safari: {
    name: "African Safari Adventure",
    price: 2199,
    duration: 10,
    rating: 4.7,
    description: "10 days wildlife safari across Kenya and Tanzania",
    features: ["Flights included", "Safari lodge", "Game drives", "Masai village visit", "Photography guide"],
    images: ["/placeholder.svg?height=300&width=500", "/placeholder.svg?height=300&width=500"],
    itinerary: [
      "Day 1-2: Arrival and Nairobi National Park",
      "Day 3-4: Masai Mara game drives",
      "Day 5-6: Serengeti National Park",
      "Day 7-8: Ngorongoro Crater",
      "Day 9: Cultural village visit",
      "Day 10: Departure",
    ],
  },
  caribbean: {
    name: "Caribbean Cruise",
    price: 999,
    duration: 5,
    rating: 4.5,
    description: "5 days luxury cruise visiting multiple Caribbean islands",
    features: [
      "Luxury cruise ship",
      "All meals included",
      "Entertainment shows",
      "Multiple destinations",
      "Pool access",
    ],
    images: ["/placeholder.svg?height=300&width=500", "/placeholder.svg?height=300&width=500"],
    itinerary: [
      "Day 1: Departure from Miami",
      "Day 2: Cozumel, Mexico",
      "Day 3: Jamaica",
      "Day 4: Grand Cayman",
      "Day 5: Return to Miami",
    ],
  },
  europe: {
    name: "European Grand Tour",
    price: 1799,
    duration: 8,
    rating: 4.8,
    description: "8 days exploring Paris, Rome, and Barcelona",
    features: ["High-speed rail", "City center hotels", "Museum passes", "Food tours", "Local guides"],
    images: ["/placeholder.svg?height=300&width=500", "/placeholder.svg?height=300&width=500"],
    itinerary: [
      "Day 1-2: Paris - Eiffel Tower and Louvre",
      "Day 3-4: Rome - Colosseum and Vatican",
      "Day 5-6: Barcelona - Sagrada Familia and Park Güell",
      "Day 7: Travel day",
      "Day 8: Departure",
    ],
  },
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  initializeFilters()
  initializeSearch()
  initializeSort()
  initializeModals()
  initializeNavigation()
  initializeAnimations()
  cargarProductos()
})

// Filter functionality
function initializeFilters() {
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remove active class from all buttons
      filterBtns.forEach((b) => b.classList.remove("active"))
      // Add active class to clicked button
      this.classList.add("active")

      const filter = this.getAttribute("data-filter")
      filterPackages(filter)
    })
  })
}

function filterPackages(filter) {
  packageCards.forEach((card) => {
    const category = card.getAttribute("data-category")

    if (filter === "all" || category === filter) {
      card.classList.remove("hidden")
      setTimeout(() => {
        card.style.opacity = "1"
        card.style.transform = "translateY(0)"
      }, 100)
    } else {
      card.style.opacity = "0"
      card.style.transform = "translateY(20px)"
      setTimeout(() => {
        card.classList.add("hidden")
      }, 300)
    }
  })
}

// Search functionality
function initializeSearch() {
  searchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase()

    packageCards.forEach((card) => {
      const title = card.querySelector("h3").textContent.toLowerCase()
      const description = card.querySelector(".package-description").textContent.toLowerCase()

      if (title.includes(searchTerm) || description.includes(searchTerm)) {
        card.style.display = "block"
        setTimeout(() => {
          card.style.opacity = "1"
          card.style.transform = "translateY(0)"
        }, 100)
      } else {
        card.style.opacity = "0"
        card.style.transform = "translateY(20px)"
        setTimeout(() => {
          card.style.display = "none"
        }, 300)
      }
    })
  })
}

// Sort functionality
function initializeSort() {
  sortSelect.addEventListener("change", function () {
    const sortBy = this.value
    const packagesGrid = document.getElementById("packagesGrid")
    const cards = Array.from(packageCards)

    cards.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return Number.parseInt(a.getAttribute("data-price")) - Number.parseInt(b.getAttribute("data-price"))
        case "price-high":
          return Number.parseInt(b.getAttribute("data-price")) - Number.parseInt(a.getAttribute("data-price"))
        case "duration":
          return Number.parseInt(a.getAttribute("data-duration")) - Number.parseInt(b.getAttribute("data-duration"))
        case "rating":
          return Number.parseFloat(b.getAttribute("data-rating")) - Number.parseFloat(a.getAttribute("data-rating"))
        default:
          return 0
      }
    })

    // Animate the reordering
    cards.forEach((card, index) => {
      card.style.order = index
      card.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s both`
    })
  })
}

// Modal functionality
function initializeModals() {
  // Quick view buttons
  quickViewBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const packageId = this.getAttribute("data-package")
      showQuickView(packageId)
    })
  })

  // Book now buttons
  bookBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const packageId = this.getAttribute("data-package")
      showBookingModal(packageId)
    })
  })

  // Close modal buttons
  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = this.closest(".modal")
      closeModal(modal)
    })
  })

  // Close modal when clicking outside
  modals.forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal(this)
      }
    })
  })
}

function showQuickView(packageId) {
  const modal = document.getElementById("quickViewModal")
  const modalBody = document.getElementById("modalBody")
  const package = packageData[packageId]

  modalBody.innerHTML = `
        <div class="quick-view-content">
            <img src="${package.images[0]}" alt="${package.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 1rem;">
            <h2>${package.name}</h2>
            <div class="rating" style="margin: 1rem 0;">
                <i class="fas fa-star"></i>
                <span>${package.rating}</span>
            </div>
            <p style="margin-bottom: 1rem;">${package.description}</p>
            <div class="features" style="margin-bottom: 1rem;">
                <h4>What's Included:</h4>
                <ul style="margin-left: 1rem;">
                    ${package.features.map((feature) => `<li>${feature}</li>`).join("")}
                </ul>
            </div>
            <div class="itinerary" style="margin-bottom: 1rem;">
                <h4>Itinerary:</h4>
                <ul style="margin-left: 1rem;">
                    ${package.itinerary.map((day) => `<li>${day}</li>`).join("")}
                </ul>
            </div>
            <div class="price-info" style="text-align: center; margin-top: 2rem;">
                <div style="font-size: 2rem; font-weight: bold; color: #2563eb;">$${package.price}</div>
                <div style="color: #64748b;">per person for ${package.duration} days</div>
                <button class="book-btn" data-package="${packageId}" style="margin-top: 1rem;">Book Now</button>
            </div>
        </div>
    `

  // Add event listener to the new book button
  const newBookBtn = modalBody.querySelector(".book-btn")
  newBookBtn.addEventListener("click", () => {
    closeModal(modal)
    showBookingModal(packageId)
  })

  modal.style.display = "block"
}

function showBookingModal(packageId) {
  const modal = document.getElementById("bookingModal")
  const package = packageData[packageId]

  // Update booking summary
  document.getElementById("selectedPackage").textContent = package.name
  document.getElementById("totalPrice").textContent = `$${package.price}`

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("checkIn").setAttribute("min", today)

  modal.style.display = "block"
}

function closeModal(modal) {
  modal.style.display = "none"
}

// Navigation functionality
function initializeNavigation() {
  navToggle.addEventListener("click", function () {
    navMenu.classList.toggle("active")

    // Animate hamburger menu
    const spans = this.querySelectorAll("span")
    spans.forEach((span, index) => {
      span.style.transform = navMenu.classList.contains("active")
        ? `rotate(${index === 1 ? 0 : index === 0 ? 45 : -45}deg) translate(${index === 1 ? 0 : index === 0 ? 5 : -5}px, ${index === 1 ? 0 : index === 0 ? 5 : -5}px)`
        : "none"
    })
  })
}

// Booking form functionality
if (bookingForm) {
  bookingForm.addEventListener("submit", function (e) {
    e.preventDefault()

    // Get form data
    const formData = new FormData(this)
    const bookingData = Object.fromEntries(formData)

    // Simulate booking process
    const submitBtn = this.querySelector(".submit-btn")
    const originalText = submitBtn.textContent

    submitBtn.textContent = "Processing..."
    submitBtn.disabled = true

    setTimeout(() => {
      alert("Booking confirmed! You will receive a confirmation email shortly.")
      closeModal(document.getElementById("bookingModal"))
      this.reset()
      submitBtn.textContent = originalText
      submitBtn.disabled = false
    }, 2000)
  })
}

// Animation on scroll
function initializeAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animation = "fadeInUp 0.6s ease forwards"
      }
    })
  }, observerOptions)

  // Observe all package cards
  packageCards.forEach((card) => {
    observer.observe(card)
  })
}

// Update total price based on number of guests
document.getElementById("guests").addEventListener("change", function () {
  const guests = Number.parseInt(this.value) || 1
  const basePrice = Number.parseInt(document.getElementById("totalPrice").textContent.replace("$", "").replace(",", ""))
  const newTotal = basePrice * guests
  document.getElementById("totalPrice").textContent = `$${newTotal.toLocaleString()}`
})

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Header scroll effect
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header")
  if (window.scrollY > 100) {
    header.style.background = "rgba(255, 255, 255, 0.98)"
    header.style.boxShadow = "0 2px 20px rgba(0,0,0,0.1)"
  } else {
    header.style.background = "rgba(255, 255, 255, 0.95)"
    header.style.boxShadow = "none"
  }
})

async function cargarProductos() {
  try {
    const res = await fetch('http://localhost:3000/api/products');
    const productos = await res.json();
    const grid = document.getElementById('packagesGrid');
    grid.innerHTML = ''; // Limpia el grid

    productos.forEach(producto => {
      const card = document.createElement('div');
      card.className = 'package-card';
      card.setAttribute('data-category', 'beach'); // Puedes mapear categorías si tienes
      card.setAttribute('data-price', producto.precio);
      card.setAttribute('data-duration', '7'); // Si tienes duración, usa producto.duracion
      card.setAttribute('data-rating', '4.5'); // Si tienes rating, usa producto.rating

      card.innerHTML = `
        <div class="package-image">
          <img src="/placeholder.svg?height=250&width=400" alt="${producto.nombre}">
          <div class="package-badge">Nuevo</div>
          <div class="package-overlay">
            <button class="quick-view-btn" data-package="${producto.id}">Vista rápida</button>
          </div>
        </div>
        <div class="package-content">
          <div class="package-header">
            <h3>${producto.nombre}</h3>
            <div class="rating">
              <i class="fas fa-star"></i>
              <span>4.5</span>
            </div>
          </div>
          <p class="package-description">${producto.descripcion}</p>
          <div class="package-features">
            <span><i class="fas fa-plane"></i> Incluye vuelos</span>
            <span><i class="fas fa-bed"></i> Hotel</span>
          </div>
          <div class="package-footer">
            <div class="price">
              <span class="price-from">Desde</span>
              <span class="price-amount">$${producto.precio}</span>
              <span class="price-per">por persona</span>
            </div>
            <button class="book-btn" data-package="${producto.id}">Comprar</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }
}

async function fetchPaquetes() {
  const res = await fetch('/api/products/paquetes'); // <-- products, no productos
  return await res.json();
}

function renderPaquetes(paquetes) {
  const grid = document.getElementById('packagesGrid');
  grid.innerHTML = '';
  paquetes.forEach(pkg => {
    // Extrae vuelo y hotel del detalle
    const vuelo = pkg.paqueteDetallesAsPaquete.find(d => d.producto.pasaje)?.producto.pasaje;
    const hotel = pkg.paqueteDetallesAsPaquete.find(d => d.producto.hospedaje)?.producto.hospedaje;
    const vueloDesc = vuelo ? `${vuelo.origen} → ${vuelo.destino}` : 'Vuelo incluido';
    const hotelDesc = hotel ? `${hotel.ubicacion || ''}` : 'Hotel incluido';

    const card = document.createElement('div');
    card.className = 'package-card';
    card.innerHTML = `
      <div class="package-content">
        <div class="package-header">
          <h3>${pkg.nombre}</h3>
        </div>
        <p class="package-description">
          Vuelo: ${vueloDesc}<br>
          Hotel: ${hotelDesc}
        </p>
        <div class="package-features">
          <span><i class="fas fa-plane"></i> Vuelo incluido</span>
          <span><i class="fas fa-bed"></i> Hotel incluido</span>
        </div>
        <div class="package-footer">
          <div class="price">
            <span class="price-from">Desde</span>
            <span class="price-amount">$${pkg.precio}</span>
            <span class="price-per">por persona</span>
          </div>
          <button class="book-btn" data-package="${pkg.id_producto}">Comprar</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const paquetes = await fetchPaquetes();
  renderPaquetes(paquetes);
});
