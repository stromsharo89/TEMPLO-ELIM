/* Menú responsive: se abre en celulares y tabletas */
function abrirMenu() {
  const nav = document.querySelector(".navbar");
  const btn = document.querySelector(".menu-btn");
  if (!nav || !btn) return;
  const abierto = nav.classList.toggle("abierto");
  btn.setAttribute("aria-expanded", abierto);
  btn.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  const icono = btn.querySelector("i");
  if (icono) icono.className = abierto ? "fa-solid fa-xmark" : "fa-solid fa-bars";
}

function cerrarMenu() {
  const nav = document.querySelector(".navbar");
  if (nav && nav.classList.contains("abierto")) abrirMenu();
}

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".navbar");
  if (!nav) return;

  // Cierra al tocar un enlace del menú
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) cerrarMenu(); });

  // Cierra al tocar fuera del encabezado
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".header")) cerrarMenu();
  });

  // Cierra con la tecla Escape
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarMenu(); });

  // Si la pantalla vuelve a ser ancha, deja el menú en su estado normal
  window.addEventListener("resize", () => { if (window.innerWidth > 860) cerrarMenu(); });
});