// Lógica compartida para el menú de navegación (hamburguesa)

document.addEventListener("DOMContentLoaded", () => {
  setupMobileNavigation();
});

function setupMobileNavigation() {
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");

      // Animar el ícono hamburguesa si la clase 'active' se añade también al toggle
      navToggle.classList.toggle("active"); 
      
      // Si la animación del ícono de hamburguesa se controla solo con CSS (sin JS para los spans):
      // Comentado por si se prefiere la animación de autos.js que manipula los spans directamente.
      // Si se usa la animación de autos.js, se debe asegurar que los spans existen y son accesibles.
      // const spans = navToggle.querySelectorAll("span");
      // spans.forEach((span, index) => {
      //   if (navMenu.classList.contains("active")) { // O navToggle.classList.contains("active")
      //     if (index === 0) span.style.transform = "rotate(45deg) translate(5px, 5px)";
      //     if (index === 1) span.style.opacity = "0";
      //     if (index === 2) span.style.transform = "rotate(-45deg) translate(7px, -6px)";
      //   } else {
      //     span.style.transform = "none";
      //     span.style.opacity = "1";
      //   }
      // });
    });

    // Cerrar el menú si se hace clic en un enlace dentro de él (opcional pero buena UX en mobile)
    const navLinks = navMenu.querySelectorAll("a");
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        if (navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
          navToggle.classList.remove("active");
          // Resetear animación de spans si se manipulan directamente
          // const spans = navToggle.querySelectorAll("span");
          // spans.forEach(span => {
          //   span.style.transform = "none";
          //   span.style.opacity = "1";
          // });
        }
      });
    });
  }
}
