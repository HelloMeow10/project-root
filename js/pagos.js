// Checkout functionality - Visual only (data will be handled by backend)
class CheckoutManager {
  constructor() {
    this.orderData = {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    }

    this.formValidation = {
      personal: false,
      payment: false,
      terms: false,
    }

    this.init()
  }

  init() {
    this.createParticles()
    this.setupEventListeners()
    this.loadOrderSummary()
    this.revealOnScroll()
    this.setupFormValidation()
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
    // Scroll events
    window.addEventListener("scroll", () => {
      this.revealOnScroll()
    })

    // Load events
    window.addEventListener("load", () => {
      this.revealOnScroll()
    })

    // Complete purchase button
    document.getElementById("completePurchaseBtn").addEventListener("click", (e) => {
      this.handlePurchase(e)
    })

    // Terms checkbox
    document.getElementById("acceptTerms").addEventListener("change", (e) => {
      this.validateTerms(e.target.checked)
    })
  }

  // Load order summary (placeholder - will be replaced with backend data)
  loadOrderSummary() {
    // Simulate loading delay
    setTimeout(() => {
      // This would normally come from the cart/session data
      const sampleOrder = {
        items: [
          {
            id: "FL001",
            type: "flight",
            name: "Paradise Airways - NYC a CUN",
            details: "Vuelo directo • 2 pasajeros",
            price: 900,
            image: "/placeholder.svg?height=80&width=80",
          },
          {
            id: "HT001",
            type: "hotel",
            name: "Paradise Beach Resort & Spa",
            details: "Cancun, México • 3 noches",
            price: 897,
            image: "/placeholder.svg?height=80&width=80",
          },
        ],
        subtotal: 1797,
        tax: 179.7,
        total: 1976.7,
      }

      this.displayOrderSummary(sampleOrder)
    }, 1500)
  }

  // Display order summary
  displayOrderSummary(order) {
    const orderItemsContainer = document.getElementById("orderItems")

    if (order.items.length === 0) {
      orderItemsContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <img src="/placeholder.svg?height=100&width=100" alt="Carrito vacío" style="opacity: 0.5; margin-bottom: 1rem;">
          <p style="color: #718096; font-size: 1.2rem;">No hay elementos en tu carrito</p>
          <a href="packages.html" style="color: #667eea; text-decoration: none; font-weight: 600;">Ver paquetes disponibles</a>
        </div>
      `
      return
    }

    // Display order items
    orderItemsContainer.innerHTML = order.items
      .map(
        (item, index) => `
      <div class="order-item" style="animation-delay: ${index * 0.1}s">
        <img src="${item.image}" alt="${item.name}" class="order-item-image">
        <div class="order-item-details">
          <div class="order-item-name">${item.name}</div>
          <div class="order-item-info">${item.details}</div>
          <div class="order-item-price">$${item.price.toFixed(2)}</div>
        </div>
      </div>
    `,
      )
      .join("")

    // Update totals
    document.getElementById("subtotalAmount").textContent = `$${order.subtotal.toFixed(2)}`
    document.getElementById("taxAmount").textContent = `$${order.tax.toFixed(2)}`
    document.getElementById("totalAmount").textContent = `$${order.total.toFixed(2)}`
    document.getElementById("btnAmount").textContent = `$${order.total.toFixed(2)}`

    // Store order data
    this.orderData = order
  }

  // Setup form validation
  setupFormValidation() {
    // Personal form validation
    const personalInputs = document.querySelectorAll("#personalForm input, #personalForm select")
    personalInputs.forEach((input) => {
      input.addEventListener("blur", () => this.validatePersonalField(input))
      input.addEventListener("input", () => this.clearError(input))
    })

    // Payment form validation
    const paymentInputs = document.querySelectorAll("#paymentForm input")
    paymentInputs.forEach((input) => {
      input.addEventListener("blur", () => this.validatePaymentField(input))
      input.addEventListener("input", () => this.clearError(input))
    })

    // Card number formatting
    document.getElementById("cardNumber").addEventListener("input", (e) => {
      this.formatCardNumber(e.target)
    })

    // Expiry date formatting
    document.getElementById("expiryDate").addEventListener("input", (e) => {
      this.formatExpiryDate(e.target)
    })

    // CVV validation
    document.getElementById("cvv").addEventListener("input", (e) => {
      this.formatCVV(e.target)
    })
  }

  // Validate personal information field
  validatePersonalField(field) {
    const value = field.value.trim()
    const fieldName = field.name
    let isValid = true
    let errorMessage = ""

    switch (fieldName) {
      case "firstName":
      case "lastName":
        if (!value) {
          isValid = false
          errorMessage = "Este campo es obligatorio"
        } else if (value.length < 2) {
          isValid = false
          errorMessage = "Debe tener al menos 2 caracteres"
        }
        break

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!value) {
          isValid = false
          errorMessage = "Este campo es obligatorio"
        } else if (!emailRegex.test(value)) {
          isValid = false
          errorMessage = "Ingresa un correo electrónico válido"
        }
        break

      case "phone":
        const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
        if (!value) {
          isValid = false
          errorMessage = "Este campo es obligatorio"
        } else if (!phoneRegex.test(value.replace(/\s/g, ""))) {
          isValid = false
          errorMessage = "Ingresa un número de teléfono válido"
        }
        break

      case "address":
      case "city":
        if (!value) {
          isValid = false
          errorMessage = "Este campo es obligatorio"
        } else if (value.length < 3) {
          isValid = false
          errorMessage = "Debe tener al menos 3 caracteres"
        }
        break

      case "country":
        if (!value) {
          isValid = false
          errorMessage = "Selecciona un país"
        }
        break
    }

    this.showFieldError(field, isValid, errorMessage)
    this.updateFormValidation()
    return isValid
  }

  // Validate payment field
  validatePaymentField(field) {
    const value = field.value.trim()
    const fieldName = field.name
    let isValid = true
    let errorMessage = ""

    switch (fieldName) {
      case "cardNumber":
        const cardNumber = value.replace(/\s/g, "")
        if (!cardNumber) {
          isValid = false
          errorMessage = "Este campo es obligatorio"
        } else if (cardNumber.length < 13 || cardNumber.length > 19) {
          isValid = false
          errorMessage = "Número de tarjeta inválido"
        } else if (!this.validateCardNumber(cardNumber)) {
          isValid = false
          errorMessage = "Número de tarjeta inválido"
        }
        break

      case "cardName":
        if (!value) {
          isValid = false
          errorMessage = "Este campo es obligatorio"
        } else if (value.length < 3) {
          isValid = false
          errorMessage = "Debe tener al menos 3 caracteres"
        }
        break

      case "expiryDate":
        const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/
        if (!value) {
          isValid = false
          errorMessage = "Este campo es obligatorio"
        } else if (!expiryRegex.test(value)) {
          isValid = false
          errorMessage = "Formato inválido (MM/AA)"
        } else if (this.isExpired(value)) {
          isValid = false
          errorMessage = "La tarjeta está vencida"
        }
        break

      case "cvv":
        if (!value) {
          isValid = false
          errorMessage = "Este campo es obligatorio"
        } else if (value.length < 3 || value.length > 4) {
          isValid = false
          errorMessage = "CVV inválido"
        }
        break
    }

    this.showFieldError(field, isValid, errorMessage)
    this.updateFormValidation()
    return isValid
  }

  // Show field error
  showFieldError(field, isValid, errorMessage) {
    const errorElement = document.getElementById(field.name + "Error")

    if (isValid) {
      field.classList.remove("error")
      if (errorElement) {
        errorElement.classList.remove("show")
        errorElement.textContent = ""
      }
    } else {
      field.classList.add("error")
      if (errorElement) {
        errorElement.textContent = errorMessage
        errorElement.classList.add("show")
      }
    }
  }

  // Clear field error
  clearError(field) {
    field.classList.remove("error")
    const errorElement = document.getElementById(field.name + "Error")
    if (errorElement) {
      errorElement.classList.remove("show")
      errorElement.textContent = ""
    }
  }

  // Format card number
  formatCardNumber(input) {
    const value = input.value.replace(/\s/g, "").replace(/[^0-9]/gi, "")
    const formattedValue = value.match(/.{1,4}/g)?.join(" ") || value

    input.value = formattedValue

    // Detect card type and highlight icon
    this.detectCardType(value)
  }

  // Format expiry date
  formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, "")
    if (value.length >= 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4)
    }
    input.value = value
  }

  // Format CVV
  formatCVV(input) {
    input.value = input.value.replace(/[^0-9]/g, "").substring(0, 4)
  }

  // Detect card type
  detectCardType(cardNumber) {
    const cardIcons = document.querySelectorAll(".card-icon")
    cardIcons.forEach((icon) => icon.classList.remove("active"))

    if (cardNumber.startsWith("4")) {
      // Visa
      cardIcons[0]?.classList.add("active")
    } else if (cardNumber.startsWith("5") || cardNumber.startsWith("2")) {
      // Mastercard
      cardIcons[1]?.classList.add("active")
    } else if (cardNumber.startsWith("3")) {
      // American Express
      cardIcons[2]?.classList.add("active")
    }
  }

  // Validate card number using Luhn algorithm
  validateCardNumber(cardNumber) {
    let sum = 0
    let shouldDouble = false

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = Number.parseInt(cardNumber.charAt(i))

      if (shouldDouble) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }

      sum += digit
      shouldDouble = !shouldDouble
    }

    return sum % 10 === 0
  }

  // Check if card is expired
  isExpired(expiryDate) {
    const [month, year] = expiryDate.split("/")
    const expiry = new Date(2000 + Number.parseInt(year), Number.parseInt(month) - 1)
    const now = new Date()
    return expiry < now
  }

  // Validate terms acceptance
  validateTerms(accepted) {
    this.formValidation.terms = accepted
    this.updateFormValidation()
  }

  // Update form validation status
  updateFormValidation() {
    // Check personal form
    const personalForm = document.getElementById("personalForm")
    const personalInputs = personalForm.querySelectorAll("input[required], select[required]")
    this.formValidation.personal = Array.from(personalInputs).every(
      (input) => input.value.trim() !== "" && !input.classList.contains("error"),
    )

    // Check payment form
    const paymentForm = document.getElementById("paymentForm")
    const paymentInputs = paymentForm.querySelectorAll("input[required]")
    this.formValidation.payment = Array.from(paymentInputs).every(
      (input) => input.value.trim() !== "" && !input.classList.contains("error"),
    )

    // Update purchase button state
    const purchaseBtn = document.getElementById("completePurchaseBtn")
    const canPurchase = this.formValidation.personal && this.formValidation.payment && this.formValidation.terms

    purchaseBtn.disabled = !canPurchase
  }

  // Handle purchase completion
  handlePurchase(e) {
    e.preventDefault()

    const btn = e.target
    const btnText = document.getElementById("btnText")

    // Show loading state
    btnText.innerHTML = '<span class="loading"></span> Procesando...'
    btn.disabled = true

    // Simulate processing time
    setTimeout(() => {
      // Here you would normally send data to backend
      this.showSuccessModal()

      // Reset button
      btnText.textContent = "Completar Compra"
      btn.disabled = false
    }, 3000)
  }

  // Show success modal
  showSuccessModal() {
    const modal = document.getElementById("successModal")
    modal.classList.add("show")
    document.body.style.overflow = "hidden"
  }

  // Close success modal
  closeSuccessModal() {
    const modal = document.getElementById("successModal")
    modal.classList.remove("show")
    document.body.style.overflow = "auto"
  }
}

// Initialize checkout manager
let checkoutManager

document.addEventListener("DOMContentLoaded", () => {
  checkoutManager = new CheckoutManager()
})
