// La funcionalidad del menú de hamburguesa ahora está en shared-nav.js

// La lógica original de GSAP y Lenis scroll se mantiene abajo,
// pero la interacción con el menú anterior (burger, overlay) se elimina o comenta.

// let burger = document.getElementById("burger"); // Eliminado
// let overlay = document.querySelector("section"); // El overlay ahora es .nav-menu
// let heroImage = document.querySelector(".hero-image"); // No se usa en la lógica del menú nuevo
let showMenu = false; // No es necesario para el nuevo menú
let del = 3;
let i = 1;

let tl = gsap.timeline({
  repeat: -1,
  yoyo: true,
  ease: "expo.out"
});

// overlay.style.display = "none"; // El nuevo menú se oculta con left: -100%

// // --- Lógica toggleMenu anterior ---
// function toggleMenu() {
//   showMenu = !showMenu;
//   if (showMenu) {
//     // burger.classList.add("active"); // burger ya no existe
//     // overlay.style.display = "block"; // .nav-menu usa left:0 para mostrarse
//     // gsap.to(overlay, 1, {
//     //   clipPath: "polygon(0% 0%, 100% 0, 100% 100%, 0% 100%)",
//     //   ease: "expo.in"
//     // });
//   } else {
//     // burger.classList.remove("active");
//     // gsap.to(overlay, 1, {
//     //   clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
//     //   ease: "expo.out",
//     //   onComplete: () => (overlay.style.display = "none")
//     // });
//   }
// }

// burger.addEventListener("click", toggleMenu); // burger ya no existe

// --- El click en el título para abrir el menú anterior se elimina,
//     ya que ahora el .nav-toggle maneja esto.
// document.addEventListener('DOMContentLoaded', function() {
//   const navTitle = document.querySelector('nav h1'); // El selector de nav h1 cambiaría a .nav-logo a
//   if (navTitle) {
//     navTitle.style.cursor = "pointer";
//     navTitle.addEventListener('click', toggleMenu); // toggleMenu ya no existe en la forma anterior
//   }
// });

gsap.set(["#hero-1 h2, #hero-1 h1, #hero-1 h3"], {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
});

gsap.set(
  [
    `#hero-2 h2, #hero-3 h2, #hero-4 h2, #hero-5 h2,
     #hero-2 h1, #hero-3 h1, #hero-4 h1, #hero-5 h1,
     #hero-2 h3, #hero-3 h3, #hero-4 h3, #hero-5 h3`
  ],
  {
    clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"
  }
);

while (i < 5) {
  tl.to(`#hero-${i} h2`, 0.9, {
    clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
    delay: del
  })
    .to(
      `#hero-${i} h1`,
      0.9,
      {
        clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"
      },
      "-=0.3"
    )
    .to(
      `#hero-${i} h3`,
      0.9,
      {
        clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"
      },
      "-=0.3"
    )
    .to(
      `#hero-${i} .hi-${i}`,
      0.7,
      {
        clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"
      },
      "-=1"
    )
    .to(`#hero-${i + 1} h2`, 0.9, {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
    })
    .to(
      `#hero-${i + 1} h1`,
      0.9,
      {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
      },
      "-=0.3"
    )
    .to(
      `#hero-${i + 1} h3`,
      0.9,
      {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
      },
      "-=0.3"
    );

  i++;
}

document.addEventListener("DOMContentLoaded", () => {
  const gradientText = document.querySelector(".animated-gradient-text");

  // Cambiar colores dinámicamente
  const colors = ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"];
  gradientText.style.backgroundImage = `linear-gradient(to right, ${colors.join(", ")})`;

  // Cambiar velocidad de animación
  gradientText.style.animationDuration = "3s";
});
