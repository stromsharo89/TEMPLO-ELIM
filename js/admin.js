const MAX_BYTES = 5 * 1024 * 1024;
let db;

function avisar(texto, tipo = "ok") {
  const m = document.getElementById("mensajeAdmin");
  m.textContent = texto;
  m.className = "mensaje " + tipo;
}

function validarImagen(archivo) {
  if (!archivo) return true;
  if (!archivo.type.startsWith("image/")) { avisar("El archivo debe ser una imagen.", "error"); return false; }
  if (archivo.size > MAX_BYTES) { avisar("La imagen supera los 5 MB.", "error"); return false; }
  return true;
}

async function subirImagen(archivo) {
  const ext = (archivo.name.split(".").pop() || "jpg").toLowerCase();
  const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(ruta, archivo, { contentType: archivo.type });
  if (error) throw error;
  return ruta;
}

async function borrarImagen(ruta) {
  if (ruta) await db.storage.from(BUCKET).remove([ruta]);
}

/* ---------- Eventos ---------- */
async function cargarEventos() {
  const lista = document.getElementById("listaEventos");
  const { data, error } = await db.from("eventos").select("*").order("fecha", { ascending: false });
  if (error) { lista.textContent = "No se pudieron cargar los eventos."; return; }
  if (!data.length) { lista.textContent = "Todavía no hay eventos."; return; }
  lista.innerHTML = data.map(e => `
    <div class="admin-item" data-id="${e.id}">
      ${e.imagen_path ? `<img src="${urlImagen(e.imagen_path)}" alt="">` : ""}
      <div><strong>${escapar(e.titulo)}</strong><br><small>${formatoFecha(e.fecha)}</small></div>
      <button class="boton claro" data-accion="editar">Editar</button>
      <button class="boton peligro" data-accion="borrar">Eliminar</button>
    </div>`).join("");
  lista._datos = data;
}

document.getElementById("listaEventos").addEventListener("click", async (ev) => {
  const btn = ev.target.closest("button[data-accion]");
  if (!btn) return;
  const lista = ev.currentTarget;
  const id = btn.closest(".admin-item").dataset.id;
  const evento = lista._datos.find(e => e.id === id);
  if (btn.dataset.accion === "editar") {
    document.getElementById("eventoId").value = evento.id;
    document.getElementById("rutaImagenEvento").value = evento.imagen_path || "";
    document.getElementById("tituloEvento").value = evento.titulo;
    document.getElementById("fechaEvento").value = evento.fecha || "";
    document.getElementById("descripcionEvento").value = evento.descripcion || "";
    document.getElementById("formEvento").scrollIntoView({ behavior: "smooth" });
    avisar("Editando evento. Si no eliges una foto nueva, se conserva la actual.");
  } else if (confirm("¿Eliminar este evento?")) {
    const { error } = await db.from("eventos").delete().eq("id", id);
    if (error) return avisar("No se pudo eliminar: " + error.message, "error");
    await borrarImagen(evento.imagen_path);
    avisar("Evento eliminado.");
    cargarEventos();
  }
});

document.getElementById("formEvento").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const archivo = document.getElementById("imagenEvento").files[0];
  if (!validarImagen(archivo)) return;
  avisar("Guardando...");
  try {
    const id = document.getElementById("eventoId").value;
    const rutaActual = document.getElementById("rutaImagenEvento").value || null;
    let ruta = rutaActual;
    if (archivo) ruta = await subirImagen(archivo);
    const fila = {
      titulo: document.getElementById("tituloEvento").value.trim(),
      fecha: document.getElementById("fechaEvento").value || null,
      descripcion: document.getElementById("descripcionEvento").value.trim(),
      imagen_path: ruta
    };
    const { error } = id ? await db.from("eventos").update(fila).eq("id", id)
                         : await db.from("eventos").insert(fila);
    if (error) throw error;
    if (archivo && rutaActual) await borrarImagen(rutaActual);
    ev.target.reset();
    document.getElementById("eventoId").value = "";
    document.getElementById("rutaImagenEvento").value = "";
    avisar("Evento guardado.");
    cargarEventos();
  } catch (err) {
    console.error(err);
    avisar("No se pudo guardar: " + err.message, "error");
  }
});

/* ---------- Fotos ---------- */
async function cargarFotos() {
  const lista = document.getElementById("listaFotos");
  const { data, error } = await db.from("fotos").select("*").order("created_at", { ascending: false });
  if (error) { lista.textContent = "No se pudieron cargar las fotografías."; return; }
  if (!data.length) { lista.textContent = "Todavía no hay fotografías."; return; }
  lista.innerHTML = data.map(f => `
    <div class="admin-item" data-id="${f.id}" data-ruta="${escapar(f.imagen_path)}">
      <img src="${urlImagen(f.imagen_path)}" alt="">
      <div>${escapar(f.titulo || "Sin título")}</div>
      <button class="boton peligro">Eliminar</button>
    </div>`).join("");
}

document.getElementById("listaFotos").addEventListener("click", async (ev) => {
  const btn = ev.target.closest("button");
  if (!btn || !confirm("¿Eliminar esta fotografía?")) return;
  const item = btn.closest(".admin-item");
  const { error } = await db.from("fotos").delete().eq("id", item.dataset.id);
  if (error) return avisar("No se pudo eliminar: " + error.message, "error");
  await borrarImagen(item.dataset.ruta);
  avisar("Fotografía eliminada.");
  cargarFotos();
});

document.getElementById("formFoto").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const archivo = document.getElementById("archivoFoto").files[0];
  if (!archivo || !validarImagen(archivo)) return;
  avisar("Subiendo...");
  try {
    const ruta = await subirImagen(archivo);
    const { error } = await db.from("fotos").insert({
      titulo: document.getElementById("tituloFoto").value.trim() || null,
      imagen_path: ruta
    });
    if (error) { await borrarImagen(ruta); throw error; }
    ev.target.reset();
    avisar("Fotografía subida.");
    cargarFotos();
  } catch (err) {
    console.error(err);
    avisar("No se pudo subir: " + err.message, "error");
  }
});

/* ---------- Arranque: sesión + permiso de admin ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  db = iniciarSupabase();
  const { data: { session } } = await db.auth.getSession();
  if (!session) { window.location.href = "login.html"; return; }
  const { data: admin } = await db.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
  if (!admin) { await db.auth.signOut(); window.location.href = "login.html"; return; }

  document.getElementById("cerrarSesion").addEventListener("click", async () => {
    await db.auth.signOut();
    window.location.href = "login.html";
  });
  cargarEventos();
  cargarFotos();
});