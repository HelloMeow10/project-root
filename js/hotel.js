// Hotel booking functionality - Visual only (no cart functionality)
class HotelBooking {
  constructor() {
    this.sampleHotels = [
      {
        id: "HT001",
        name: "Paradise Beach Resort & Spa",
        location: "Cancun, Mexico",
        locationCode: "CUN",
        rating: 5,
        price: 299,
        description:
          "Luxurious beachfront resort with stunning ocean views, multiple pools, and world-class dining options.",
        amenities: ["Pool", "Spa", "Restaurant", "Beach Access", "Free WiFi", "Fitness Center"],
        images: [
          "/placeholder.svg?height=300&width=500",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
        ],
      },
      {
        id: "HT002",
        name: "Tropical Oasis Hotel",
        location: "Punta Cana, Dominican Republic",
        locationCode: "PUJ",
        rating: 4,
        price: 199,
        description:
          "All-inclusive resort surrounded by tropical gardens with direct access to a pristine white sand beach.",
        amenities: ["All-Inclusive", "Pool", "Restaurant", "Beach Access", "Free WiFi"],
        images: [
          "/placeholder.svg?height=300&width=500",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
        ],
      },
      {
        id: "HT003",
        name: "Royal Palm Luxury Hotel",
        location: "Nassau, Bahamas",
        locationCode: "NAS",
        rating: 5,
        price: 349,
        description:
          "Elegant luxury hotel offering exceptional service, gourmet dining, and breathtaking views of the Caribbean.",
        amenities: ["Pool", "Spa", "Fine Dining", "Beach Access", "Free WiFi", "Butler Service"],
        images: [
          "/placeholder.svg?height=300&width=500",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
        ],
      },
      {
        id: "HT004",
        name: "Sunset Bay Resort",
        location: "Montego Bay, Jamaica",
        locationCode: "MBJ",
        rating: 4,
        price: 229,
        description:
          "Family-friendly resort with water park, kids club, and activities for all ages on a beautiful private beach.",
        amenities: ["Water Park", "Kids Club", "All-Inclusive", "Pool", "Beach Access"],
        images: [
          "/placeholder.svg?height=300&width=500",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
        ],
      },
      {
        id: "HT005",
        name: "Azure Waters Boutique Hotel",
        location: "Aruba",
        locationCode: "AUA",
        rating: 4,
        price: 259,
        description: "Intimate boutique hotel with personalized service, stylish rooms, and a serene atmosphere.",
        amenities: ["Pool", "Restaurant", "Beach Access", "Free WiFi", "Spa"],
        images: [
          "/placeholder.svg?height=300&width=500",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
        ],
      },
      {
        id: "HT006",
        name: "Grand Palms Resort",
        location: "Cancun, Mexico",
        locationCode: "CUN",
        rating: 5,
        price: 329,
        description:
          "Opulent resort featuring swim-up suites, gourmet restaurants, and a world-class spa in the heart of Cancun.",
        amenities: ["Swim-up Suites", "Spa", "Fine Dining", "Beach Access", "Free WiFi", "Fitness Center"],
        images: [
          "/placeholder.svg?height=300&width=500",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
          "/placeholder.svg?height=100&width=150",
        ],
      },
    ]

    this.currentHotel = null
    this.init()
  }

  init() {
    this.createParticles()
    this.setupEventListeners()
    this.setupDateValidation()
    this.displayHotels(this.sampleHotels)
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
      let filteredHotels = this.sampleHotels

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
      resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
                    <img src="/placeholder.svg?height=100&width=100" alt="No hotels" style="opacity: 0.5; margin-bottom: 1rem;">
                    <p style="color: #718096; font-size: 1.2rem;">No hotels found for your search criteria.</p>
                </div>
            `
      return
    }

    resultsContainer.innerHTML = hotels
      .map(
        (hotel, index) => `
            <div class="hotel-card" style="animation-delay: ${index * 0.1}s">
                <div class="hotel-image-container">
                    <img src="${hotel.images[0]}" alt="${hotel.name}" class="hotel-image">
                    <div class="hotel-rating">
                        ${this.getStarRating(hotel.rating)}
                    </div>
                </div>
                <div class="hotel-content">
                    <h3 class="hotel-name">${hotel.name}</h3>
                    <div class="hotel-location">
                        📍 ${hotel.location}
                    </div>
                    <div class="hotel-amenities">
                        ${hotel.amenities
                          .slice(0, 3)
                          .map((amenity) => `<span class="amenity">${amenity}</span>`)
                          .join("")}
                        ${
                          hotel.amenities.length > 3
                            ? `<span class="amenity">+${hotel.amenities.length - 3} more</span>`
                            : ""
                        }
                    </div>
                    <div class="hotel-price-container">
                        <div class="hotel-price">
                            $${hotel.price} <span class="hotel-price-night">/ night</span>
                        </div>
                        <button class="view-details-btn" onclick="hotelBooking.showHotelDetails('${hotel.id}')">
                            View Details
                        </button>
                    </div>
                    <button class="add-to-cart-btn">
                        Add to Cart
                    </button>
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
