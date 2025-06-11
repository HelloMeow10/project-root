// Global state management
class PackageBuilder {
  constructor() {
    this.currentStep = 1
    this.totalSteps = 6
    this.packageData = {
      destination: null,
      dates: {
        checkIn: null,
        checkOut: null,
        travelers: 1,
      },
      accommodation: null,
      transportation: {
        flights: null,
        carRental: null,
        localTransport: null,
      },
      activities: [],
    }
    this.pricing = {
      accommodation: 0,
      transportation: 0,
      activities: 0,
      carRental: 0,
      total: 0,
    }
    this.init()
  }

  init() {
    this.bindEvents()
    this.loadInitialData()
    this.updateProgress()
  }

  bindEvents() {
    // Navigation events
    document.getElementById("nextBtn").addEventListener("click", () => this.nextStep())
    document.getElementById("prevBtn").addEventListener("click", () => this.prevStep())
    document.getElementById("saveBtn").addEventListener("click", () => this.savePackage())

    // Step navigation from progress indicator
    document.querySelectorAll(".step").forEach((step) => {
      step.addEventListener("click", (e) => {
        const stepNumber = Number.parseInt(e.currentTarget.dataset.step)
        if (stepNumber <= this.currentStep || this.isStepCompleted(stepNumber - 1)) {
          this.goToStep(stepNumber)
        }
      })
    })

    // Date change events
    document.getElementById("checkIn").addEventListener("change", () => this.updateDuration())
    document.getElementById("checkOut").addEventListener("change", () => this.updateDuration())
    document.getElementById("travelers").addEventListener("change", () => this.updatePricing())

    // Search functionality
    document
      .getElementById("destinationSearch")
      .addEventListener("input", (e) => this.searchDestinations(e.target.value))

    // Car rental toggle
    document.getElementById("carRentalToggle").addEventListener("change", (e) => this.toggleCarRental(e.target.checked))

    // Activity category filters
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.filterActivities(e.target.dataset.category))
    })

    // Floating summary toggle
    document.getElementById("toggleSummary").addEventListener("click", () => this.toggleFloatingSummary())

    // Modal events
    document.getElementById("editPackageBtn").addEventListener("click", () => this.closeModal())
    document.getElementById("proceedBookingBtn").addEventListener("click", () => this.proceedToBooking())

    // Mobile navigation
    document.querySelector(".nav-toggle").addEventListener("click", () => this.toggleMobileNav())
  }

  // Data loading methods (ready for API integration)
  async loadInitialData() {
    this.showLoading()
    try {
      await Promise.all([
        this.loadDestinations(),
        this.loadAccommodations(),
        this.loadTransportOptions(),
        this.loadActivities(),
      ])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      this.hideLoading()
    }
  }

  async loadDestinations() {
    // Simulate API call - replace with actual API endpoint
    const destinations = await this.simulateApiCall([
      {
        id: 1,
        name: "Paris, France",
        country: "France",
        image: "/placeholder.svg?height=200&width=300",
        features: ["Historic", "Culture", "Romance"],
        basePrice: 150,
      },
      {
        id: 2,
        name: "Tokyo, Japan",
        country: "Japan",
        image: "/placeholder.svg?height=200&width=300",
        features: ["Modern", "Culture", "Food"],
        basePrice: 180,
      },
      {
        id: 3,
        name: "New York, USA",
        country: "USA",
        image: "/placeholder.svg?height=200&width=300",
        features: ["Urban", "Shopping", "Entertainment"],
        basePrice: 200,
      },
      {
        id: 4,
        name: "Bali, Indonesia",
        country: "Indonesia",
        image: "/placeholder.svg?height=200&width=300",
        features: ["Beach", "Relaxation", "Nature"],
        basePrice: 120,
      },
      {
        id: 5,
        name: "Rome, Italy",
        country: "Italy",
        image: "/placeholder.svg?height=200&width=300",
        features: ["Historic", "Culture", "Food"],
        basePrice: 140,
      },
      {
        id: 6,
        name: "Dubai, UAE",
        country: "UAE",
        image: "/placeholder.svg?height=200&width=300",
        features: ["Luxury", "Modern", "Shopping"],
        basePrice: 220,
      },
    ])

    this.renderDestinations(destinations)
  }

  async loadAccommodations() {
    const accommodations = await this.simulateApiCall([
      {
        id: 1,
        type: "hotel",
        name: "Luxury Hotel",
        rating: 5,
        features: ["Pool", "Spa", "Restaurant", "WiFi", "Gym"],
        pricePerNight: 250,
        icon: "fas fa-hotel",
      },
      {
        id: 2,
        type: "resort",
        name: "Beach Resort",
        rating: 4,
        features: ["Beach Access", "Pool", "Restaurant", "WiFi"],
        pricePerNight: 180,
        icon: "fas fa-umbrella-beach",
      },
      {
        id: 3,
        type: "apartment",
        name: "City Apartment",
        rating: 4,
        features: ["Kitchen", "WiFi", "City View", "Parking"],
        pricePerNight: 120,
        icon: "fas fa-building",
      },
      {
        id: 4,
        type: "hostel",
        name: "Budget Hostel",
        rating: 3,
        features: ["Shared Kitchen", "WiFi", "Common Area"],
        pricePerNight: 45,
        icon: "fas fa-bed",
      },
    ])

    this.renderAccommodations(accommodations)
  }

  async loadTransportOptions() {
    const transportData = await this.simulateApiCall({
      flights: [
        { id: 1, type: "economy", name: "Economy Class", price: 500, features: ["Standard seat", "Meal included"] },
        {
          id: 2,
          type: "business",
          name: "Business Class",
          price: 1200,
          features: ["Premium seat", "Priority boarding", "Lounge access"],
        },
        {
          id: 3,
          type: "first",
          name: "First Class",
          price: 2500,
          features: ["Luxury seat", "Premium dining", "Personal service"],
        },
      ],
      cars: [
        {
          id: 1,
          type: "economy",
          name: "Economy Car",
          image: "/placeholder.svg?height=120&width=200",
          features: ["Manual", "AC", "4 Seats"],
          pricePerDay: 35,
        },
        {
          id: 2,
          type: "compact",
          name: "Compact SUV",
          image: "/placeholder.svg?height=120&width=200",
          features: ["Automatic", "AC", "5 Seats", "GPS"],
          pricePerDay: 55,
        },
        {
          id: 3,
          type: "luxury",
          name: "Luxury Sedan",
          image: "/placeholder.svg?height=120&width=200",
          features: ["Automatic", "Leather", "Premium Audio", "GPS"],
          pricePerDay: 95,
        },
      ],
      localTransport: [
        { id: 1, type: "public", name: "Public Transport Pass", price: 50, features: ["Unlimited rides", "All zones"] },
        { id: 2, type: "taxi", name: "Taxi Credits", price: 150, features: ["Door-to-door", "24/7 available"] },
        {
          id: 3,
          type: "private",
          name: "Private Driver",
          price: 300,
          features: ["Personal driver", "Flexible schedule"],
        },
      ],
    })

    this.renderTransportOptions(transportData)
  }

  async loadActivities() {
    const activities = await this.simulateApiCall([
      {
        id: 1,
        name: "City Walking Tour",
        category: "culture",
        image: "/placeholder.svg?height=200&width=300",
        rating: 4.8,
        duration: "3 hours",
        price: 45,
        features: ["Guide included", "Small group", "Historical sites"],
        description: "Explore the city's most iconic landmarks with a knowledgeable local guide.",
      },
      {
        id: 2,
        name: "Mountain Hiking Adventure",
        category: "adventure",
        image: "/placeholder.svg?height=200&width=300",
        rating: 4.6,
        duration: "Full day",
        price: 85,
        features: ["Equipment included", "Professional guide", "Lunch included"],
        description: "Challenge yourself with a thrilling mountain hiking experience.",
      },
      {
        id: 3,
        name: "Cooking Class Experience",
        category: "food",
        image: "/placeholder.svg?height=200&width=300",
        rating: 4.9,
        duration: "4 hours",
        price: 75,
        features: ["Ingredients included", "Recipe book", "Wine tasting"],
        description: "Learn to cook authentic local dishes with professional chefs.",
      },
      {
        id: 4,
        name: "Spa & Wellness Package",
        category: "relaxation",
        image: "/placeholder.svg?height=200&width=300",
        rating: 4.7,
        duration: "Half day",
        price: 120,
        features: ["Full body massage", "Facial treatment", "Sauna access"],
        description: "Relax and rejuvenate with our comprehensive wellness package.",
      },
      {
        id: 5,
        name: "Wildlife Safari",
        category: "nature",
        image: "/placeholder.svg?height=200&width=300",
        rating: 4.8,
        duration: "Full day",
        price: 150,
        features: ["Transportation included", "Professional guide", "Lunch included"],
        description: "Discover amazing wildlife in their natural habitat.",
      },
      {
        id: 6,
        name: "Scuba Diving Experience",
        category: "adventure",
        image: "/placeholder.svg?height=200&width=300",
        rating: 4.5,
        duration: "Half day",
        price: 95,
        features: ["Equipment included", "Certified instructor", "Underwater photos"],
        description: "Explore the underwater world with certified diving instructors.",
      },
    ])

    this.renderActivities(activities)
  }

  // Rendering methods
  renderDestinations(destinations) {
    const grid = document.getElementById("destinationsGrid")
    grid.innerHTML = destinations
      .map(
        (dest) => `
            <div class="destination-card" data-destination-id="${dest.id}" onclick="packageBuilder.selectDestination(${dest.id})">
                <div class="destination-image" style="background-image: url('${dest.image}')">
                    <div class="destination-overlay">
                        <div class="destination-info">
                            <h4>${dest.name}</h4>
                            <p>${dest.country}</p>
                        </div>
                    </div>
                </div>
                <div class="destination-content">
                    <div class="destination-features">
                        ${dest.features.map((feature) => `<span class="feature-tag">${feature}</span>`).join("")}
                    </div>
                    <div class="destination-price">From $${dest.basePrice}/night</div>
                </div>
            </div>
        `,
      )
      .join("")
  }

  renderAccommodations(accommodations) {
    const container = document.getElementById("accommodationOptions")
    container.innerHTML = accommodations
      .map(
        (acc) => `
            <div class="accommodation-card" data-accommodation-id="${acc.id}" onclick="packageBuilder.selectAccommodation(${acc.id})">
                <div class="accommodation-header">
                    <div class="accommodation-icon">
                        <i class="${acc.icon}"></i>
                    </div>
                    <div class="accommodation-info">
                        <h4>${acc.name}</h4>
                        <div class="accommodation-rating">
                            ${Array(acc.rating)
                              .fill()
                              .map(() => '<i class="fas fa-star"></i>')
                              .join("")}
                        </div>
                    </div>
                </div>
                <ul class="accommodation-features">
                    ${acc.features.map((feature) => `<li><i class="fas fa-check"></i> ${feature}</li>`).join("")}
                </ul>
                <div class="accommodation-price">$${acc.pricePerNight}/night</div>
            </div>
        `,
      )
      .join("")
  }

  renderTransportOptions(transportData) {
    // Render flight options
    const flightContainer = document.getElementById("flightOptions")
    flightContainer.innerHTML = transportData.flights
      .map(
        (flight) => `
            <div class="transport-option" data-flight-id="${flight.id}" onclick="packageBuilder.selectFlight(${flight.id})">
                <h5>${flight.name}</h5>
                <p>${flight.features.join(", ")}</p>
                <div class="transport-price">$${flight.price}</div>
            </div>
        `,
      )
      .join("")

    // Render car options
    const carContainer = document.getElementById("carOptions")
    carContainer.innerHTML = transportData.cars
      .map(
        (car) => `
            <div class="car-option" data-car-id="${car.id}" onclick="packageBuilder.selectCar(${car.id})">
                <div class="car-image" style="background-image: url('${car.image}')"></div>
                <div class="car-info">
                    <h5>${car.name}</h5>
                    <div class="car-features">
                        ${car.features.map((feature) => `<span class="car-feature">${feature}</span>`).join("")}
                    </div>
                    <div class="car-price">$${car.pricePerDay}/day</div>
                </div>
            </div>
        `,
      )
      .join("")

    // Render local transport options
    const localContainer = document.getElementById("localTransportOptions")
    localContainer.innerHTML = transportData.localTransport
      .map(
        (transport) => `
            <div class="transport-option" data-transport-id="${transport.id}" onclick="packageBuilder.selectLocalTransport(${transport.id})">
                <h5>${transport.name}</h5>
                <p>${transport.features.join(", ")}</p>
                <div class="transport-price">$${transport.price}</div>
            </div>
        `,
      )
      .join("")
  }

  renderActivities(activities, category = "all") {
    const grid = document.getElementById("activitiesGrid")
    const filteredActivities =
      category === "all" ? activities : activities.filter((activity) => activity.category === category)

    grid.innerHTML = filteredActivities
      .map(
        (activity) => `
            <div class="activity-card" data-activity-id="${activity.id}" onclick="packageBuilder.toggleActivity(${activity.id})">
                <div class="activity-image" style="background-image: url('${activity.image}')">
                    <div class="activity-overlay">${activity.duration}</div>
                </div>
                <div class="activity-content">
                    <div class="activity-header">
                        <div class="activity-info">
                            <h4>${activity.name}</h4>
                            <div class="activity-rating">
                                <i class="fas fa-star"></i>
                                <span>${activity.rating}</span>
                            </div>
                        </div>
                    </div>
                    <p class="activity-description">${activity.description}</p>
                    <div class="activity-features">
                        ${activity.features.map((feature) => `<span class="activity-feature">${feature}</span>`).join("")}
                    </div>
                    <div class="activity-price">$${activity.price}</div>
                </div>
            </div>
        `,
      )
      .join("")
  }

  // Selection methods
  selectDestination(destinationId) {
    // Remove previous selection
    document.querySelectorAll(".destination-card").forEach((card) => card.classList.remove("selected"))
    // Add selection to clicked card
    document.querySelector(`[data-destination-id="${destinationId}"]`).classList.add("selected")
    // Update package data
    this.packageData.destination = destinationId
    this.updateFloatingSummary()
  }

  selectAccommodation(accommodationId) {
    document.querySelectorAll(".accommodation-card").forEach((card) => card.classList.remove("selected"))
    document.querySelector(`[data-accommodation-id="${accommodationId}"]`).classList.add("selected")
    this.packageData.accommodation = accommodationId
    this.updatePricing()
    this.updateFloatingSummary()
  }

  selectFlight(flightId) {
    document.querySelectorAll("[data-flight-id]").forEach((card) => card.classList.remove("selected"))
    document.querySelector(`[data-flight-id="${flightId}"]`).classList.add("selected")
    this.packageData.transportation.flights = flightId
    this.updatePricing()
    this.updateFloatingSummary()
  }

  selectCar(carId) {
    document.querySelectorAll(".car-option").forEach((card) => card.classList.remove("selected"))
    document.querySelector(`[data-car-id="${carId}"]`).classList.add("selected")
    this.packageData.transportation.carRental = carId
    this.updatePricing()
    this.updateFloatingSummary()
  }

  selectLocalTransport(transportId) {
    document.querySelectorAll("[data-transport-id]").forEach((card) => card.classList.remove("selected"))
    document.querySelector(`[data-transport-id="${transportId}"]`).classList.add("selected")
    this.packageData.transportation.localTransport = transportId
    this.updatePricing()
    this.updateFloatingSummary()
  }

  toggleActivity(activityId) {
    const card = document.querySelector(`[data-activity-id="${activityId}"]`)
    const isSelected = card.classList.contains("selected")

    if (isSelected) {
      card.classList.remove("selected")
      this.packageData.activities = this.packageData.activities.filter((id) => id !== activityId)
    } else {
      card.classList.add("selected")
      this.packageData.activities.push(activityId)
    }

    this.updatePricing()
    this.updateFloatingSummary()
  }

  // Navigation methods
  nextStep() {
    if (this.currentStep < this.totalSteps && this.validateCurrentStep()) {
      this.currentStep++
      this.showStep(this.currentStep)
      this.updateProgress()
      this.updateNavigation()
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--
      this.showStep(this.currentStep)
      this.updateProgress()
      this.updateNavigation()
    }
  }

  goToStep(stepNumber) {
    this.currentStep = stepNumber
    this.showStep(this.currentStep)
    this.updateProgress()
    this.updateNavigation()
  }

  showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll(".step-content").forEach((step) => {
      step.classList.remove("active")
    })

    // Show current step
    document.getElementById(`step${stepNumber}`).classList.add("active")

    // Update step indicators
    document.querySelectorAll(".step").forEach((step, index) => {
      step.classList.remove("active", "completed")
      if (index + 1 === stepNumber) {
        step.classList.add("active")
      } else if (index + 1 < stepNumber) {
        step.classList.add("completed")
      }
    })

    // Special handling for final step
    if (stepNumber === this.totalSteps) {
      this.updateSummary()
    }
  }

  updateProgress() {
    const progressFill = document.getElementById("progressFill")
    const progressPercentage = (this.currentStep / this.totalSteps) * 100
    progressFill.style.width = `${progressPercentage}%`
  }

  updateNavigation() {
    const prevBtn = document.getElementById("prevBtn")
    const nextBtn = document.getElementById("nextBtn")
    const saveBtn = document.getElementById("saveBtn")

    prevBtn.disabled = this.currentStep === 1

    if (this.currentStep === this.totalSteps) {
      nextBtn.style.display = "none"
      saveBtn.style.display = "flex"
    } else {
      nextBtn.style.display = "flex"
      saveBtn.style.display = "none"
    }
  }

  validateCurrentStep() {
    switch (this.currentStep) {
      case 1:
        return this.packageData.destination !== null
      case 2:
        return this.packageData.dates.checkIn && this.packageData.dates.checkOut
      case 3:
        return this.packageData.accommodation !== null
      case 4:
        return this.packageData.transportation.flights !== null
      case 5:
        return true // Activities are optional
      default:
        return true
    }
  }

  isStepCompleted(stepNumber) {
    return this.validateCurrentStep() && stepNumber < this.currentStep
  }

  // Utility methods
  updateDuration() {
    const checkIn = document.getElementById("checkIn").value
    const checkOut = document.getElementById("checkOut").value

    if (checkIn && checkOut) {
      const startDate = new Date(checkIn)
      const endDate = new Date(checkOut)
      const diffTime = Math.abs(endDate - startDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      document.getElementById("durationDays").textContent = diffDays
      this.packageData.dates.checkIn = checkIn
      this.packageData.dates.checkOut = checkOut
      this.packageData.dates.duration = diffDays

      this.updatePricing()
    }
  }

  updatePricing() {
    // This method would calculate pricing based on selections
    // For now, it's a placeholder for the pricing logic
    const duration = this.packageData.dates.duration || 0
    const travelers = Number.parseInt(document.getElementById("travelers").value) || 1

    // Calculate accommodation cost
    if (this.packageData.accommodation) {
      // This would fetch the actual price from the accommodation data
      this.pricing.accommodation = 150 * duration * travelers // Placeholder calculation
    }

    // Calculate transportation cost
    if (this.packageData.transportation.flights) {
      this.pricing.transportation = 500 * travelers // Placeholder calculation
    }

    // Calculate car rental cost
    if (this.packageData.transportation.carRental) {
      this.pricing.carRental = 50 * duration // Placeholder calculation
    }

    // Calculate activities cost
    this.pricing.activities = this.packageData.activities.length * 75 * travelers // Placeholder calculation

    // Calculate total
    this.pricing.total =
      this.pricing.accommodation + this.pricing.transportation + this.pricing.carRental + this.pricing.activities

    this.updatePriceDisplay()
  }

  updatePriceDisplay() {
    document.getElementById("priceAccommodation").textContent = `$${this.pricing.accommodation}`
    document.getElementById("priceTransport").textContent = `$${this.pricing.transportation}`
    document.getElementById("priceCarRental").textContent = `$${this.pricing.carRental}`
    document.getElementById("priceActivities").textContent = `$${this.pricing.activities}`
    document.getElementById("totalPrice").textContent = `$${this.pricing.total}`
    document.getElementById("floatingPrice").textContent = `$${this.pricing.total}`
  }

  searchDestinations(query) {
    // This would implement search functionality
    // For now, it's a placeholder
    const suggestions = document.getElementById("destinationSuggestions")
    if (query.length > 2) {
      suggestions.style.display = "block"
      suggestions.innerHTML = `
                <div class="suggestion-item">Paris, France</div>
                <div class="suggestion-item">Tokyo, Japan</div>
                <div class="suggestion-item">New York, USA</div>
            `
    } else {
      suggestions.style.display = "none"
    }
  }

  toggleCarRental(enabled) {
    const carOptions = document.getElementById("carOptions")
    if (enabled) {
      carOptions.classList.add("active")
    } else {
      carOptions.classList.remove("active")
      // Clear car rental selection
      this.packageData.transportation.carRental = null
      document.querySelectorAll(".car-option").forEach((card) => card.classList.remove("selected"))
      this.updatePricing()
    }
  }

  filterActivities(category) {
    // Update active filter button
    document.querySelectorAll(".category-btn").forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`[data-category="${category}"]`).classList.add("active")

    // This would re-render activities based on category
    // For now, it's a placeholder
    console.log(`Filtering activities by category: ${category}`)
  }

  updateFloatingSummary() {
    const selectedItems = document.getElementById("selectedItems")
    let summaryHTML = ""

    if (this.packageData.destination) {
      summaryHTML += "<p>✓ Destination selected</p>"
    }
    if (this.packageData.accommodation) {
      summaryHTML += "<p>✓ Accommodation selected</p>"
    }
    if (this.packageData.transportation.flights) {
      summaryHTML += "<p>✓ Flights selected</p>"
    }
    if (this.packageData.transportation.carRental) {
      summaryHTML += "<p>✓ Car rental selected</p>"
    }
    if (this.packageData.activities.length > 0) {
      summaryHTML += `<p>✓ ${this.packageData.activities.length} activities selected</p>`
    }

    if (summaryHTML === "") {
      summaryHTML = "<p>Start building your package...</p>"
    }

    selectedItems.innerHTML = summaryHTML
  }

  toggleFloatingSummary() {
    const summaryBody = document.querySelector(".summary-body")
    const toggleIcon = document.querySelector(".toggle-summary i")

    if (summaryBody.style.display === "none") {
      summaryBody.style.display = "block"
      toggleIcon.className = "fas fa-chevron-up"
    } else {
      summaryBody.style.display = "none"
      toggleIcon.className = "fas fa-chevron-down"
    }
  }

  updateSummary() {
    // Update the summary section with all selections
    // This would populate the summary with actual data
    console.log("Updating package summary", this.packageData)
  }

  savePackage() {
    this.showLoading()

    // Simulate API call to save package
    setTimeout(() => {
      this.hideLoading()
      this.showSuccessModal()
    }, 2000)
  }

  showSuccessModal() {
    document.getElementById("successModal").style.display = "block"
  }

  closeModal() {
    document.getElementById("successModal").style.display = "none"
  }

  proceedToBooking() {
    // This would redirect to booking page or show booking form
    alert("Proceeding to booking...")
    this.closeModal()
  }

  toggleMobileNav() {
    const navMenu = document.querySelector(".nav-menu")
    navMenu.classList.toggle("active")
  }

  showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex"
  }

  hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none"
  }

  // Utility method to simulate API calls
  simulateApiCall(data, delay = 1000) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay)
    })
  }
}

// Initialize the package builder when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.packageBuilder = new PackageBuilder()

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("checkIn").setAttribute("min", today)
  document.getElementById("checkOut").setAttribute("min", today)

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
})
