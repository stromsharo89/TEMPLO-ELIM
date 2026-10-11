document.addEventListener("DOMContentLoaded", async () => {
  const cont = document.getElementById("contenedorGaleria");
  let fotos = [];
  let actual = 0;
  let ultimoFoco = null;

  /* ---------- Visor de imagen grande ---------- */
  const visor = document.createElement("div");
  visor.className = "visor";
  visor.setAttribute("role", "dialog");
  visor.setAttribute("aria-modal", "true");
  visor.setAttribute("aria-label", "Fotografía ampliada");
  visor.hidden = true;
  visor.innerHTML = `
    <button class="visor-cerrar" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
    <button class="visor-nav visor-ant" aria-label="Anterior"><i class="fa-solid fa-chevron-left"></i></button>
    <figure class="visor-figura">
      <img class="visor-img" alt="">
      <figcaption class="visor-pie">
        <h3 class="visor-titulo"></h3>
        <span class="visor-fecha"></span>
      </figcaption>
    </figure>
    <button class="visor-nav visor-sig" aria-label="Siguiente"><i class="fa-solid fa-chevron-right"></i></button>`;
  document.body.appendChild(visor);
  const $ = (s) => visor.querySelector(s);

  function mostrar(i) {
    actual = (i + fotos.length) % fotos.length;
    const f = fotos[actual];
    const img = $(".visor-img");
    img.classList.remove("listo");
    img.onload = () => img.classList.add("listo");
    img.src = urlImagen(f.imagen_path);
    img.alt = f.titulo || "Fotografía de la iglesia";
    $(".visor-titulo").textContent = f.titulo || "";
    $(".visor-titulo").hidden = !f.titulo;
    $(".visor-fecha").textContent = `${actual + 1} de ${fotos.length}`;
    $(".visor-ant").hidden = fotos.length < 2;
    $(".visor-sig").hidden = fotos.length < 2;
  }

  function abrir(id) {
    const i = fotos.findIndex(f => f.id === id);
    if (i < 0) return;
    ultimoFoco = document.activeElement;
    mostrar(i);
    visor.hidden = false;
    requestAnimationFrame(() => visor.classList.add("abierto"));
    document.body.classList.add("sin-scroll");
    $(".visor-cerrar").focus();
  }

  function cerrar() {
    visor.classList.remove("abierto");
    document.body.classList.remove("sin-scroll");
    setTimeout(() => { visor.hidden = true; $(".visor-img").src = ""; }, 200);
    if (ultimoFoco) ultimoFoco.focus();
  }

  $(".visor-cerrar").addEventListener("click", cerrar);
  $(".visor-ant").addEventListener("click", () => mostrar(actual - 1));
  $(".visor-sig").addEventListener("click", () => mostrar(actual + 1));
  visor.addEventListener("click", (e) => {
    if (e.target === visor || e.target.classList.contains("visor-figura")) cerrar();
  });
  document.addEventListener("keydown", (e) => {
    if (visor.hidden) return;
    if (e.key === "Escape") cerrar();
    if (e.key === "ArrowLeft" && fotos.length > 1) mostrar(actual - 1);
    if (e.key === "ArrowRight" && fotos.length > 1) mostrar(actual + 1);
  });

  // Deslizar con el dedo en celulares
  let inicioX = null;
  visor.addEventListener("touchstart", (e) => { inicioX = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener("touchend", (e) => {
    if (inicioX === null || fotos.length < 2) return;
    const dx = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(dx) > 60) mostrar(actual + (dx < 0 ? 1 : -1));
    inicioX = null;
  });

  /* ---------- Cuadrícula de fotos ---------- */
  cont.addEventListener("click", (e) => {
    const f = e.target.closest(".foto-card[data-id]");
    if (f) abrir(f.dataset.id);
  });
  cont.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const f = e.target.closest(".foto-card[data-id]");
    if (f) { e.preventDefault(); abrir(f.dataset.id); }
  });

  try {
    const { data, error } = await iniciarSupabase()
      .from("fotos").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    if (!data.length) { cont.innerHTML = '<p class="aviso">Aún no hay fotografías publicadas.</p>'; return; }
    fotos = data;
    cont.innerHTML = data.map(f => `
      <figure class="foto-card" data-id="${f.id}" role="button" tabindex="0"
              aria-label="Ver en grande: ${escapar(f.titulo || "fotografía")}">
        <div class="foto-marco">
          <img src="${urlImagen(f.imagen_path)}" alt="${escapar(f.titulo || "Fotografía de la iglesia")}" loading="lazy">
          <span class="evento-lupa"><i class="fa-solid fa-magnifying-glass-plus"></i> Ver grande</span>
        </div>
        ${f.titulo ? `<figcaption>${escapar(f.titulo)}</figcaption>` : ""}
      </figure>`).join("");
  } catch (err) {
    console.error(err);
    cont.innerHTML = '<p class="aviso">No pudimos cargar la galería. Intenta de nuevo más tarde.</p>';
  }
});