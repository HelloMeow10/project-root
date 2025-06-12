// Flight booking functionality - Visual only (no cart functionality)
class FlightBooking {
  constructor() {
    this.sampleFlights = [
      {
        id: "FL001",
        airline: "Paradise Airways",
        logo: "../imagenes/cute-tropical-3ber1fipqhlyc3uf.jpg",
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
        logo: "../imagenes/cute-tropical-3ber1fipqhlyc3uf.jpg",
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

    this.init()
  }

  init() {
    this.createParticles()
    this.setupEventListeners()
    this.setupDateValidation()
    this.displayFlights(this.sampleFlights)
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
      searchBtnText.textContent = "🔍 Search Flights"
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
                <button class="add-to-cart-btn">
                    Add to Cart
                </button>
            </div>
        `,
      )
      .join("")
  }
}

// Initialize the flight booking system
let flightBooking

document.addEventListener("DOMContentLoaded", () => {
  flightBooking = new FlightBooking()
})

async function cargarVuelos() {
  try {
    const res = await fetch('/api/products/vuelos');
    const vuelos = await res.json();
    const resultsContainer = document.getElementById("flightResults");
    resultsContainer.innerHTML = '';

    if (vuelos.length === 0) {
      resultsContainer.innerHTML = `<p>No hay vuelos disponibles.</p>`;
      return;
    }

    vuelos.forEach(vuelo => {
      const card = document.createElement('div');
      card.className = 'flight-card';
      card.innerHTML = `
        <div class="flight-header">
          <div class="airline-info">
            <div class="airline">${vuelo.pasaje?.origen || ''} → ${vuelo.pasaje?.destino || ''}</div>
          </div>
          <div class="price">$${vuelo.precio}</div>
        </div>
        <div class="flight-details">
          <div class="detail-item">
            <div class="detail-label">Aerolínea</div>
            <div class="detail-value">${vuelo.nombre}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Clase</div>
            <div class="detail-value">${vuelo.pasaje?.clase || '-'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Asientos</div>
            <div class="detail-value">${vuelo.pasaje?.asientos_disponibles || '-'}</div>
          </div>
        </div>
        <button class="add-to-cart-btn">Agregar al carrito</button>
      `;
      resultsContainer.appendChild(card);
    });
  } catch (error) {
    console.error('Error al cargar vuelos:', error);
  }
}

// Llama a cargarVuelos cuando cargue la página
document.addEventListener("DOMContentLoaded", () => {
  cargarVuelos();
});
