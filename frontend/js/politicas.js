// Import particlesJS library
const particlesJS = window.particlesJS

// Configuración de Particles.js
particlesJS("particles-js", {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: {
      value: "#ffffff",
    },
    shape: {
      type: "circle",
      stroke: {
        width: 0,
        color: "#000000",
      },
    },
    opacity: {
      value: 0.5,
      random: false,
      anim: {
        enable: false,
        speed: 1,
        opacity_min: 0.1,
        sync: false,
      },
    },
    size: {
      value: 3,
      random: true,
      anim: {
        enable: false,
        speed: 40,
        size_min: 0.1,
        sync: false,
      },
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#ffffff",
      opacity: 0.4,
      width: 1,
    },
    move: {
      enable: true,
      speed: 6,
      direction: "none",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false,
      attract: {
        enable: false,
        rotateX: 600,
        rotateY: 1200,
      },
    },
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: true,
        mode: "repulse",
      },
      onclick: {
        enable: true,
        mode: "push",
      },
      resize: true,
    },
    modes: {
      grab: {
        distance: 400,
        line_linked: {
          opacity: 1,
        },
      },
      bubble: {
        distance: 400,
        size: 40,
        duration: 2,
        opacity: 8,
        speed: 3,
      },
      repulse: {
        distance: 200,
        duration: 0.4,
      },
      push: {
        particles_nb: 4,
      },
      remove: {
        particles_nb: 2,
      },
    },
  },
  retina_detect: true,
})

// Variables globales
let currentTab = "terms"
let isLoading = true

// Elementos del DOM
const loadingScreen = document.getElementById("loadingScreen")
const tabButtons = document.querySelectorAll(".tab-button")
const tabContents = document.querySelectorAll(".tab-content")
const backToTopButton = document.getElementById("backToTop")
const contentCards = document.querySelectorAll(".content-card")

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

// Función principal de inicialización
function initializeApp() {
  // Simular tiempo de carga
  setTimeout(() => {
    hideLoadingScreen()
    initializeEventListeners()
    initializeAnimations()
    initializeScrollEffects()
  }, 2500)
}

// Ocultar pantalla de carga
function hideLoadingScreen() {
  loadingScreen.classList.add("hidden")
  isLoading = false
}

// Inicializar event listeners
function initializeEventListeners() {
  // Event listeners para las pestañas
  tabButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const tabName = e.currentTarget.getAttribute("data-tab")
      switchTab(tabName, e.currentTarget)
    })
  })

  // Event listener para el botón de volver arriba
  backToTopButton.addEventListener("click", scrollToTop)

  // Event listeners para efectos de scroll
  window.addEventListener("scroll", handleScroll)
  window.addEventListener("resize", handleResize)

  // Event listeners para animaciones de hover en tarjetas
  initializeCardHoverEffects()

  // Event listener para navegación por teclado
  document.addEventListener("keydown", handleKeyboardNavigation)
}

// Cambiar entre pestañas
function switchTab(tabName, buttonElement) {
  if (tabName === currentTab) return

  // Remover clases activas
  tabButtons.forEach((btn) => btn.classList.remove("active"))
  tabContents.forEach((content) => content.classList.remove("active"))

  // Agregar clases activas
  buttonElement.classList.add("active")
  document.getElementById(tabName).classList.add("active")

  // Actualizar pestaña actual
  currentTab = tabName

  // Animar contenido
  animateTabContent()

  // Scroll suave al contenido
  document.querySelector(".content-wrapper").scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}

// Animar contenido de pestañas
function animateTabContent() {
  const activeContent = document.querySelector(".tab-content.active")
  const cards = activeContent.querySelectorAll(".content-card")

  cards.forEach((card, index) => {
    card.style.opacity = "0"
    card.style.transform = "translateY(30px)"

    setTimeout(() => {
      card.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
      card.style.opacity = "1"
      card.style.transform = "translateY(0)"
    }, index * 150)
  })
}

// Scroll suave hacia arriba
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
}

// Manejar eventos de scroll
function handleScroll() {
  const scrollY = window.pageYOffset

  // Mostrar/ocultar botón de volver arriba
  if (scrollY > 300) {
    backToTopButton.classList.add("visible")
  } else {
    backToTopButton.classList.remove("visible")
  }

  // Efecto parallax en el header
  const header = document.querySelector(".header")
  if (header) {
    const speed = scrollY * 0.3
    header.style.transform = `translateY(${speed}px)`
  }

  // Animaciones al hacer scroll
  animateOnScroll()
}

// Manejar redimensionamiento de ventana
function handleResize() {
  // Reinicializar particles.js si es necesario
  if (window.pJSDom && window.pJSDom[0]) {
    window.pJSDom[0].pJS.fn.particlesRefresh()
  }
}

// Inicializar animaciones
function initializeAnimations() {
  // Observador de intersección para animaciones
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-in")
      }
    })
  }, observerOptions)

  // Observar elementos animables
  const animatableElements = document.querySelectorAll(".content-card, .contact-item, .info-item")
  animatableElements.forEach((el) => observer.observe(el))
}

// Animaciones al hacer scroll
function animateOnScroll() {
  const elements = document.querySelectorAll(".content-card, .info-item, .contact-item")

  elements.forEach((element) => {
    const elementTop = element.getBoundingClientRect().top
    const elementVisible = 150

    if (elementTop < window.innerHeight - elementVisible) {
      element.classList.add("animate-in")
    }
  })
}

// Inicializar efectos de scroll
function initializeScrollEffects() {
  // Smooth scroll para enlaces internos
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
}

// Efectos de hover para tarjetas
function initializeCardHoverEffects() {
  const cards = document.querySelectorAll(".content-card, .info-item, .contact-item")

  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-10px) scale(1.02)"
      this.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
    })

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)"
      this.style.boxShadow = ""
    })
  })

  // Efectos especiales para elementos interactivos
  const interactiveElements = document.querySelectorAll(".policy-item, .data-type, .security-item, .right-item")

  interactiveElements.forEach((element) => {
    element.addEventListener("mouseenter", function () {
      this.style.transform = "scale(1.05)"
    })

    element.addEventListener("mouseleave", function () {
      this.style.transform = "scale(1)"
    })
  })
}

// Navegación por teclado
function handleKeyboardNavigation(e) {
  // Navegación entre pestañas con las teclas de flecha
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    const currentIndex = Array.from(tabButtons).findIndex((btn) => btn.classList.contains("active"))
    let newIndex

    if (e.key === "ArrowLeft") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1
    } else {
      newIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0
    }

    const newTab = tabButtons[newIndex].getAttribute("data-tab")
    switchTab(newTab, tabButtons[newIndex])
  }

  // Scroll hacia arriba con la tecla Home
  if (e.key === "Home") {
    e.preventDefault()
    scrollToTop()
  }
}

// Funciones de utilidad
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Optimizar el scroll con debounce
const optimizedScrollHandler = debounce(handleScroll, 10)
window.addEventListener("scroll", optimizedScrollHandler)

// Efectos adicionales para mejorar la experiencia
document.addEventListener("DOMContentLoaded", () => {
  // Precargar imágenes si las hay
  preloadImages()

  // Inicializar tooltips personalizados
  initializeTooltips()

  // Configurar accesibilidad
  setupAccessibility()
})

// Precargar imágenes
function preloadImages() {
  const images = document.querySelectorAll("img[data-src]")
  images.forEach((img) => {
    const imageLoader = new Image()
    imageLoader.onload = function () {
      img.src = this.src
      img.classList.add("loaded")
    }
    imageLoader.src = img.getAttribute("data-src")
  })
}

// Inicializar tooltips personalizados
function initializeTooltips() {
  const tooltipElements = document.querySelectorAll("[data-tooltip]")

  tooltipElements.forEach((element) => {
    element.addEventListener("mouseenter", showTooltip)
    element.addEventListener("mouseleave", hideTooltip)
  })
}

function showTooltip(e) {
  const tooltip = document.createElement("div")
  tooltip.className = "custom-tooltip"
  tooltip.textContent = e.target.getAttribute("data-tooltip")
  document.body.appendChild(tooltip)

  const rect = e.target.getBoundingClientRect()
  tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + "px"
  tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + "px"

  setTimeout(() => tooltip.classList.add("visible"), 10)
}

function hideTooltip() {
  const tooltip = document.querySelector(".custom-tooltip")
  if (tooltip) {
    tooltip.remove()
  }
}

// Configurar accesibilidad
function setupAccessibility() {
  // Agregar roles ARIA
  const tablist = document.querySelector(".nav-tabs")
  if (tablist) {
    tablist.setAttribute("role", "tablist")
  }

  tabButtons.forEach((button, index) => {
    button.setAttribute("role", "tab")
    button.setAttribute("aria-selected", index === 0 ? "true" : "false")
    button.setAttribute("tabindex", index === 0 ? "0" : "-1")
  })

  tabContents.forEach((content, index) => {
    content.setAttribute("role", "tabpanel")
    content.setAttribute("aria-hidden", index === 0 ? "false" : "true")
  })
}

// Manejo de errores global
window.addEventListener("error", (e) => {
  console.error("Error en la aplicación:", e.error)
  // Aquí podrías enviar el error a un servicio de logging
})

// Optimización de rendimiento
if ("requestIdleCallback" in window) {
  requestIdleCallback(() => {
    // Tareas de baja prioridad
    initializeAnalytics()
  })
} else {
  setTimeout(initializeAnalytics, 2000)
}

function initializeAnalytics() {
  // Aquí podrías inicializar Google Analytics u otros servicios
  console.log("Analytics inicializado")
}

// Service Worker para PWA (opcional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registrado: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registro falló: ", registrationError)
      })
  })
}
