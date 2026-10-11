document.addEventListener("DOMContentLoaded", async () => {
  const cont = document.getElementById("contenedorEventos");
  let eventos = [];      // todos los eventos
  let conImagen = [];    // solo los que tienen foto (para el visor)
  let actual = 0;

  function insignia(f) {
    if (!f) return "";
    const d = new Date(f + "T00:00:00");
    const mes = d.toLocaleDateString("es-PE", { month: "short" }).replace(".", "");
    return `<div class="evento-insignia"><strong>${d.getDate()}</strong><span>${escapar(mes)}</span></div>`;
  }

  /* ---------- Visor de imagen grande ---------- */
  const visor = document.createElement("div");
  visor.className = "visor";
  visor.setAttribute("role", "dialog");
  visor.setAttribute("aria-modal", "true");
  visor.setAttribute("aria-label", "Imagen del evento");
  visor.hidden = true;
  visor.innerHTML = `
    <button class="visor-cerrar" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
    <button class="visor-nav visor-ant" aria-label="Anterior"><i class="fa-solid fa-chevron-left"></i></button>
    <figure class="visor-figura">
      <img class="visor-img" alt="">
      <figcaption class="visor-pie">
        <span class="visor-fecha"></span>
        <h3 class="visor-titulo"></h3>
        <p class="visor-desc"></p>
      </figcaption>
    </figure>
    <button class="visor-nav visor-sig" aria-label="Siguiente"><i class="fa-solid fa-chevron-right"></i></button>`;
  document.body.appendChild(visor);

  const $ = (s) => visor.querySelector(s);
  let ultimoFoco = null;

  function mostrar(i) {
    actual = (i + conImagen.length) % conImagen.length;
    const e = conImagen[actual];
    const img = $(".visor-img");
    img.classList.remove("listo");
    img.onload = () => img.classList.add("listo");
    img.src = urlImagen(e.imagen_path);
    img.alt = e.titulo;
    $(".visor-fecha").textContent = formatoFecha(e.fecha);
    $(".visor-titulo").textContent = e.titulo;
    $(".visor-desc").textContent = e.descripcion || "";
    $(".visor-desc").hidden = !e.descripcion;
    const varias = conImagen.length > 1;
    $(".visor-ant").hidden = !varias;
    $(".visor-sig").hidden = !varias;
  }

  function abrir(id) {
    const i = conImagen.findIndex(e => e.id === id);
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
    if (e.key === "ArrowLeft" && conImagen.length > 1) mostrar(actual - 1);
    if (e.key === "ArrowRight" && conImagen.length > 1) mostrar(actual + 1);
  });

  // Deslizar con el dedo en celulares
  let inicioX = null;
  visor.addEventListener("touchstart", (e) => { inicioX = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener("touchend", (e) => {
    if (inicioX === null || conImagen.length < 2) return;
    const dx = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(dx) > 60) mostrar(actual + (dx < 0 ? 1 : -1));
    inicioX = null;
  });

  /* ---------- Lista de eventos ---------- */
  cont.addEventListener("click", (e) => {
    const media = e.target.closest(".evento-media[data-id]");
    if (media) abrir(media.dataset.id);
  });
  cont.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const media = e.target.closest(".evento-media[data-id]");
    if (media) { e.preventDefault(); abrir(media.dataset.id); }
  });

  try {
    const { data, error } = await iniciarSupabase()
      .from("eventos").select("*").order("fecha", { ascending: false });
    if (error) throw error;
    if (!data.length) { cont.innerHTML = '<p class="aviso">Pronto publicaremos nuevos eventos.</p>'; return; }
    eventos = data;
    conImagen = data.filter(e => e.imagen_path);
    cont.innerHTML = data.map(e => `
      <article class="evento-card">
        ${e.imagen_path
          ? `<div class="evento-media ampliable" data-id="${e.id}" role="button" tabindex="0" aria-label="Ver imagen ampliada: ${escapar(e.titulo)}">
               <img src="${urlImagen(e.imagen_path)}" alt="${escapar(e.titulo)}" loading="lazy">
               ${insignia(e.fecha)}
               <span class="evento-lupa"><i class="fa-solid fa-magnifying-glass-plus"></i> Ver grande</span>
             </div>`
          : `<div class="evento-media"><div class="evento-sin-imagen"><i class="fa-solid fa-church"></i></div>${insignia(e.fecha)}</div>`}
        <div class="evento-info">
          <span class="fecha"><i class="fa-regular fa-calendar"></i> ${formatoFecha(e.fecha)}</span>
          <h3>${escapar(e.titulo)}</h3>
          ${e.descripcion ? `<p>${escapar(e.descripcion)}</p>` : ""}
        </div>
      </article>`).join("");
  } catch (err) {
    console.error(err);
    cont.innerHTML = '<p class="aviso">No pudimos cargar los eventos. Intenta de nuevo más tarde.</p>';
  }
});