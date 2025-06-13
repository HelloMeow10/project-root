// Hotel booking functionality - Visual only (no cart functionality)
class HotelBooking {
  constructor() {
    this.currentHotel = null
    this.hoteles = []
    this.init()
  }

  async init() {
    this.createParticles()
    this.setupEventListeners()
    this.setupDateValidation()
    await this.cargarHoteles()
    this.revealOnScroll()
  }

  async cargarHoteles() {
    try {
      const res = await fetch('/api/products/hoteles');
      const hoteles = await res.json();
      this.hoteles = hoteles;
      this.renderHoteles(hoteles);
    } catch (error) {
      console.error('Error al cargar hoteles:', error);
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
            >Agregar al carrito</button>
          </div>
        </div>
      `;
      resultsContainer.appendChild(card);
    });
  }

  // Create animated background particles
  createParticles() {
    const bgAnimation = document.getElementById("bgAnimation")
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

  // Setup event listeners
  setupEventListeners() {
    // Filter form
    document.getElementById("filterForm").addEventListener("submit", (e) => {
      this.handleFilter(e)
    })

    // Scroll events
    window.addEventListener("scroll", () => {
      this.revealOnScroll()
    })

    // Load events
    window.addEventListener("load", () => {
      this.revealOnScroll()
    })

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      const modal = document.getElementById("hotelModal")
      if (e.target === modal) {
        this.closeModal()
      }
    })
  }

  // Setup date validation
  setupDateValidation() {
    const today = new Date().toISOString().split("T")[0]
    const checkinInput = document.getElementById("checkin")
    const checkoutInput = document.getElementById("checkout")

    checkinInput.min = today
    checkoutInput.min = today

    checkinInput.addEventListener("change", function () {
      checkoutInput.min = this.value
    })
  }

  // Handle filter functionality
  handleFilter(e) {
    e.preventDefault()

    const filterBtn = document.getElementById("filterBtn")
    const filterBtnText = document.getElementById("filterBtnText")

    // Show loading animation
    filterBtnText.innerHTML = '<span class="loading"></span> Searching...'
    filterBtn.disabled = true

    setTimeout(() => {
      const formData = new FormData(e.target)
      const filterCriteria = {
        destination: formData.get("destination"),
        checkin: formData.get("checkin"),
        checkout: formData.get("checkout"),
        guests: formData.get("guests"),
        rating: Number.parseInt(formData.get("rating")),
      }

      // Filter hotels based on criteria
      let filteredHotels = this.hoteles || []

      if (filterCriteria.destination !== "all") {
        filteredHotels = filteredHotels.filter((hotel) => hotel.locationCode === filterCriteria.destination)
      }

      if (filterCriteria.rating > 0) {
        filteredHotels = filteredHotels.filter((hotel) => hotel.rating >= filterCriteria.rating)
      }

      this.displayHotels(filteredHotels)

      // Reset button
      filterBtnText.textContent = "🔍 Find Hotels"
      filterBtn.disabled = false
    }, 1500)
  }

  // Display hotels
  displayHotels(hotels) {
    const resultsContainer = document.getElementById("hotelResults")

    if (hotels.length === 0) {
      resultsContainer.innerHTML = `<div style="text-align: center; padding: 3rem;">No hay hoteles disponibles.</div>`
      return
    }

    resultsContainer.innerHTML = hotels
      .map(
        (hotel, index) => `
        <div class="hotel-card" style="animation-delay: ${index * 0.1}s">
          <div class="hotel-content">
            <h3 class="hotel-name">${hotel.nombre}</h3>
            <div class="hotel-location">
              📍 ${hotel.hospedaje?.ubicacion || "Ubicación no disponible"}
            </div>
            <div class="hotel-price-container">
              <div class="hotel-price">
                $${hotel.precio} <span class="hotel-price-night">/ noche</span>
              </div>
              <button class="add-to-cart-btn">Agregar al carrito</button>
            </div>
          </div>
        </div>
      `,
      )
      .join("")
  }

  // Get star rating HTML
  getStarRating(rating) {
    let stars = ""
    for (let i = 0; i < rating; i++) {
      stars += "⭐"
    }
    return stars
  }

  // Show hotel details in modal
  showHotelDetails(hotelId) {
    const hotel = this.sampleHotels.find((h) => h.id === hotelId)
    if (!hotel) return

    this.currentHotel = hotel

    const modalContent = document.getElementById("modalContent")
    modalContent.innerHTML = `
            <div class="modal-hotel-details">
                <div>
                    <div class="modal-hotel-images">
                        <img src="${hotel.images[0]}" alt="${hotel.name}" class="modal-hotel-main-image" id="mainHotelImage">
                    </div>
                    <div class="modal-hotel-thumbnails">
                        ${hotel.images
                          .map(
                            (img, index) => `
                            <img src="${img}" alt="${hotel.name} image ${index + 1}" 
                                class="modal-hotel-thumbnail" 
                                onclick="hotelBooking.changeMainImage('${img}')">
                        `,
                          )
                          .join("")}
                    </div>
                </div>
                <div class="modal-hotel-info">
                    <h2>${hotel.name}</h2>
                    <div class="modal-hotel-rating">
                        ${this.getStarRating(hotel.rating)}
                    </div>
                    <div class="modal-hotel-location">
                        📍 ${hotel.location}
                    </div>
                    <p class="modal-hotel-description">
                        ${hotel.description}
                    </p>
                    <h3 style="margin-bottom: 1rem;">Amenities</h3>
                    <div class="modal-hotel-amenities">
                        ${hotel.amenities
                          .map(
                            (amenity) => `
                            <div class="modal-hotel-amenity">
                                ✓ ${amenity}
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                    <div class="modal-hotel-price-container">
                        <div class="modal-hotel-price">
                            $${hotel.price} <span class="hotel-price-night">/ night</span>
                        </div>
                        <button class="modal-add-to-cart-btn">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `

    const modal = document.getElementById("hotelModal")
    modal.classList.add("show")
    document.body.style.overflow = "hidden"
  }

  // Change main image in modal
  changeMainImage(imgSrc) {
    document.getElementById("mainHotelImage").src = imgSrc
  }

  // Close modal
  closeModal() {
    const modal = document.getElementById("hotelModal")
    modal.classList.remove("show")
    document.body.style.overflow = "auto"
  }
}

// Initialize the hotel booking system
let hotelBooking

document.addEventListener("DOMContentLoaded", () => {
  hotelBooking = new HotelBooking()
})

// Evento global para agregar al carrito
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.add-to-cart-btn');
  if (!btn) return;

  const id = btn.getAttribute('data-id');
  const tipo = btn.getAttribute('data-tipo');
  const nombre = btn.getAttribute('data-nombre');
  const precio = parseFloat(btn.getAttribute('data-precio'));
  if (!id || !tipo || !nombre || isNaN(precio)) {
    alert('Error al agregar al carrito');
    return;
  }
  const producto = { id, tipo, nombre, precio, cantidad: 1 };

  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const existente = carrito.find(item => item.id == id && item.tipo == tipo);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push(producto);
  }
  localStorage.setItem('carrito', JSON.stringify(carrito));

  const cartCount = document.getElementById('cartCount');
  if (cartCount) cartCount.textContent = carrito.length;

  alert('Hotel agregado al carrito');
});
