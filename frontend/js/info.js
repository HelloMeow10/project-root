// Navegación móvil
const hamburger = document.getElementById("hamburger")
const navMenu = document.getElementById("nav-menu")

hamburger.addEventListener("click", () => {
  navMenu.classList.toggle("active")
})

// Cerrar menú al hacer clic en un enlace
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("active")
  })
})

// Navbar scroll effect
window.addEventListener("scroll", () => {
  const navbar = document.getElementById("navbar")
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled")
  } else {
    navbar.classList.remove("scrolled")
  }
})

// Slideshow
let currentSlide = 0
const slides = document.querySelectorAll(".slide")
const indicators = document.querySelectorAll(".indicator")

function showSlide(index) {
  slides.forEach((slide) => slide.classList.remove("active"))
  indicators.forEach((indicator) => indicator.classList.remove("active"))

  slides[index].classList.add("active")
  indicators[index].classList.add("active")
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length
  showSlide(currentSlide)
}

// Auto slideshow
setInterval(nextSlide, 5000)

// Manual slideshow control
indicators.forEach((indicator, index) => {
  indicator.addEventListener("click", () => {
    currentSlide = index
    showSlide(currentSlide)
  })
})

// Smooth scrolling para enlaces de navegación
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

// Animaciones de scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible")
    }
  })
}, observerOptions)

// Observar elementos con animación
document.querySelectorAll(".fade-in, .timeline-item").forEach((el) => {
  observer.observe(el)
})

// Contador animado para estadísticas
function animateCounter(element, target, duration = 2000) {
  let start = 0
  const increment = target / (duration / 16)

  function updateCounter() {
    start += increment
    if (start < target) {
      element.textContent = Math.floor(start)
      requestAnimationFrame(updateCounter)
    } else {
      element.textContent = target
    }
  }

  updateCounter()
}

// Iniciar contadores cuando sean visibles
const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = Number.parseInt(entry.target.getAttribute("data-target"))
        animateCounter(entry.target, target)
        statsObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.5 },
)

document.querySelectorAll(".stat-number").forEach((stat) => {
  statsObserver.observe(stat)
})

// Formulario de contacto
document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault()

  // Simular envío del formulario
  const submitBtn = this.querySelector(".submit-btn")
  const originalText = submitBtn.textContent

  submitBtn.textContent = "Enviando..."
  submitBtn.disabled = true

  setTimeout(() => {
    submitBtn.textContent = "¡Mensaje Enviado!"
    submitBtn.style.background = "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"

    setTimeout(() => {
      submitBtn.textContent = originalText
      submitBtn.disabled = false
      submitBtn.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      this.reset()
    }, 2000)
  }, 1500)
})

// Efecto parallax suave
window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset
  const parallaxElements = document.querySelectorAll(".slide")

  parallaxElements.forEach((element) => {
    const speed = 0.5
    element.style.transform = `translateY(${scrolled * speed}px)`
  })
})

// Animación de entrada para elementos
function animateOnScroll() {
  const elements = document.querySelectorAll(".fade-in:not(.visible)")

  elements.forEach((element) => {
    const elementTop = element.getBoundingClientRect().top
    const elementVisible = 150

    if (elementTop < window.innerHeight - elementVisible) {
      element.classList.add("visible")
    }
  })
}

window.addEventListener("scroll", animateOnScroll)

// Inicializar animaciones al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  animateOnScroll()

  // Añadir clase de carga completada
  document.body.classList.add("loaded")
})

// Efecto de typing para el hero
function typeWriter(element, text, speed = 100) {
  let i = 0
  element.innerHTML = ""

  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i)
      i++
      setTimeout(type, speed)
    }
  }

  type()
}

// Aplicar efecto typing al primer slide
setTimeout(() => {
  const firstSlideTitle = document.querySelector(".slide.active h1")
  if (firstSlideTitle) {
    const originalText = firstSlideTitle.textContent
    typeWriter(firstSlideTitle, originalText, 80)
  }
}, 500)
