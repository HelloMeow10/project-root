// Flight data and functionality
class FlightBooking {
  constructor() {
    this.sampleFlights = [
      {
        id: "FL001",
        airline: "Paradise Airways",
        logo: "/placeholder.svg?height=50&width=50",
        from: "NYC",
        to: "CUN",
        departure: "08:00",
        arrival: "12:30",
        duration: "4h 30m",
        price: 450,
        stops: "Direct",
      },
      {
        id: "FL002",
        airline: "Tropical Express",
        logo: "/placeholder.svg?height=50&width=50",
        from: "NYC",
        to: "CUN",
        departure: "14:15",
        arrival: "19:45",
        duration: "5h 30m",
        price: 380,
        stops: "1 Stop",
      },
      {
        id: "FL003",
        airline: "Island Hopper",
        logo: "/placeholder.svg?height=50&width=50",
        from: "LAX",
        to: "PUJ",
        departure: "10:30",
        arrival: "18:20",
        duration: "7h 50m",
        price: 520,
        stops: "1 Stop",
      },
      {
        id: "FL004",
        airline: "Caribbean Connect",
        logo: "/placeholder.svg?height=50&width=50",
        from: "MIA",
        to: "NAS",
        departure: "09:45",
        arrival: "11:15",
        duration: "1h 30m",
        price: 280,
        stops: "Direct",
      },
      {
        id: "FL005",
        airline: "Vacation Wings",
        logo: "/placeholder.svg?height=50&width=50",
        from: "CHI",
        to: "MBJ",
        departure: "16:00",
        arrival: "21:30",
        duration: "5h 30m",
        price: 490,
        stops: "Direct",
      },
    ]

    this.cart = JSON.parse(localStorage.getItem("tourismCart")) || []
    this.init()
  }

  init() {
    this.createParticles()
    this.setupEventListeners()
    this.setupDateValidation()
    this.displayFlights(this.sampleFlights)
    this.updateCart()
    this.revealOnScroll()
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
    // Search form
    document.getElementById("searchForm").addEventListener("submit", (e) => {
      this.handleSearch(e)
    })

    // Scroll events
    window.addEventListener("scroll", () => {
      this.revealOnScroll()
    })

    // Load events
    window.addEventListener("load", () => {
      this.revealOnScroll()
    })
  }

  // Setup date validation
  setupDateValidation() {
    const today = new Date().toISOString().split("T")[0]
    const departureInput = document.getElementById("departure")
    const returnInput = document.getElementById("return")

    departureInput.min = today
    returnInput.min = today

    departureInput.addEventListener("change", function () {
      returnInput.min = this.value
    })
  }

  // Handle search functionality
  handleSearch(e) {
    e.preventDefault()

    const searchBtn = document.getElementById("searchBtn")
    const searchBtnText = document.getElementById("searchBtnText")

    // Show loading animation
    searchBtnText.innerHTML = '<span class="loading"></span> Searching...'
    searchBtn.disabled = true

    setTimeout(() => {
      const formData = new FormData(e.target)
      const searchCriteria = {
        from: formData.get("from"),
        to: formData.get("to"),
        departure: formData.get("departure"),
        return: formData.get("return"),
        passengers: formData.get("passengers"),
      }

      // Filter flights based on search criteria
      const filteredFlights = this.sampleFlights.filter(
        (flight) => flight.from === searchCriteria.from && flight.to === searchCriteria.to,
      )

      this.displayFlights(filteredFlights)

      // Reset button
      searchBtnText.textContent = "Search Flights"
      searchBtn.disabled = false
    }, 1500)
  }

  // Display flights
  displayFlights(flights) {
    const resultsContainer = document.getElementById("flightResults")

    if (flights.length === 0) {
      resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <img src="/placeholder.svg?height=100&width=100" alt="No flights" style="opacity: 0.5; margin-bottom: 1rem;">
                    <p style="color: #718096; font-size: 1.2rem;">No flights found for your search criteria.</p>
                </div>
            `
      return
    }

    resultsContainer.innerHTML = flights
      .map(
        (flight, index) => `
            <div class="flight-card" style="animation-delay: ${index * 0.1}s">
                <div class="flight-header">
                    <div class="airline-info">
                        <img src="${flight.logo}" alt="${flight.airline}" class="airline-logo">
                        <div class="airline">${flight.airline}</div>
                    </div>
                    <div class="price">$${flight.price}</div>
                </div>
                <div class="flight-details">
                    <div class="detail-item">
                        <div class="detail-label">From</div>
                        <div class="detail-value">${flight.from}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">To</div>
                        <div class="detail-value">${flight.to}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Departure</div>
                        <div class="detail-value">${flight.departure}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Arrival</div>
                        <div class="detail-value">${flight.arrival}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Duration</div>
                        <div class="detail-value">${flight.duration}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Stops</div>
                        <div class="detail-value">${flight.stops}</div>
                    </div>
                </div>
                <button class="add-to-cart-btn" onclick="flightBooking.addToCart(${JSON.stringify(flight).replace(/"/g, "&quot;")})">
                    Add to Cart
                </button>
            </div>
        `,
      )
      .join("")
  }

  // Cart management
  updateCart() {
    const cartItems = document.getElementById("cartItems")
    const cartTotal = document.getElementById("cartTotal")

    if (this.cart.length === 0) {
      cartItems.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <img src="/placeholder.svg?height=80&width=80" alt="Empty cart" style="opacity: 0.5; margin-bottom: 1rem;">
                    <p style="color: #718096;">Your cart is empty</p>
                </div>
            `
      cartTotal.textContent = "Total: $0"
      return
    }

    cartItems.innerHTML = this.cart
      .map(
        (item, index) => `
            <div class="cart-item" style="animation-delay: ${index * 0.1}s">
                <div class="cart-item-header">
                    <strong>${item.type === "flight" ? "✈️" : "🏨"} ${item.name}</strong>
                    <button class="remove-btn" onclick="flightBooking.removeFromCart('${item.id}')">Remove</button>
                </div>
                <div style="font-size: 0.9rem; color: #718096; margin: 0.5rem 0;">
                    ${item.details}
                </div>
                <div style="font-weight: 700; color: #667eea; margin-top: 0.5rem; font-size: 1.1rem;">
                    $${item.price}
                </div>
            </div>
        `,
      )
      .join("")

    const total = this.cart.reduce((sum, item) => sum + item.price, 0)
    cartTotal.textContent = `Total: $${total}`
  }

  addToCart(flight) {
    const cartItem = {
      id: flight.id,
      type: "flight",
      name: `${flight.airline}`,
      details: `${flight.from} → ${flight.to} | ${flight.departure} - ${flight.arrival}`,
      price: flight.price,
    }

    // Check if item already exists
    const existingIndex = this.cart.findIndex((item) => item.id === flight.id)
    if (existingIndex === -1) {
      this.cart.push(cartItem)
      localStorage.setItem("tourismCart", JSON.stringify(this.cart))
      this.updateCart()

      // Animate button success
      const btn = event.target
      const originalText = btn.innerHTML
      btn.innerHTML = "✓ Added to Cart!"
      btn.classList.add("success-animation")
      btn.style.background = "linear-gradient(135deg, #38a169, #2f855a)"

      setTimeout(() => {
        btn.innerHTML = originalText
        btn.classList.remove("success-animation")
        btn.style.background = "linear-gradient(135deg, #48bb78, #38a169)"
      }, 2000)
    } else {
      // Shake animation for duplicate
      const btn = event.target
      btn.style.animation = "shake 0.5s ease-in-out"
      btn.innerHTML = "Already in Cart!"
      setTimeout(() => {
        btn.style.animation = ""
        btn.innerHTML = "Add to Cart"
      }, 1500)
    }
  }

  removeFromCart(itemId) {
    this.cart = this.cart.filter((item) => item.id !== itemId)
    localStorage.setItem("tourismCart", JSON.stringify(this.cart))
    this.updateCart()
  }

  toggleCart() {
    const cartSection = document.getElementById("cartSection")
    const toggleBtn = document.querySelector(".cart-toggle")

    if (cartSection.style.display === "none") {
      cartSection.style.display = "block"
      cartSection.style.animation = "slideInFromRight 0.5s ease-out"
      toggleBtn.textContent = "Hide"
    } else {
      cartSection.style.animation = "slideOutToRight 0.5s ease-out"
      setTimeout(() => {
        cartSection.style.display = "none"
      }, 500)
      toggleBtn.textContent = "Show Cart"
    }
  }
}

// Initialize the flight booking system
let flightBooking

document.addEventListener("DOMContentLoaded", () => {
  flightBooking = new FlightBooking()
})

// Global function for cart toggle (called from HTML)
function toggleCart() {
  flightBooking.toggleCart()
}

// Dropdown carrito
document.addEventListener("DOMContentLoaded", () => {
    const cartDropdown = document.querySelector('.cart-dropdown');
    const cartToggle = document.getElementById('cartToggle');
    cartToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        cartDropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!cartDropdown.contains(e.target)) {
            cartDropdown.classList.remove('open');
        }
    });
});

// Actualiza el contador del carrito
function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartItems || !cartCount || !cartTotal) return;
    cartItems.innerHTML = this.cart.length === 0
        ? '<p>El carrito está vacío.</p>'
        : this.cart.map(item =>
            `<div>
                ${item.name}
                <span style="float:right;">$${item.price}</span>
            </div>`
        ).join('');
    cartCount.textContent = this.cart.length;
    cartTotal.textContent = '$' + this.cart.reduce((sum, item) => sum + item.price, 0);
}
