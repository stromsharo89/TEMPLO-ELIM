/* Configuración de Supabase: Project Settings > API */
const SUPABASE_URL = "https://clnixpxjzngojkyxuhyn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LSBD4Vn_cl1Zw8kx2x0J4Q_hq2XR412"; // la "anon public", nunca la "service_role"
const BUCKET = "imagenes";

let _db = null;
function iniciarSupabase() {
  if (!_db) _db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _db;
}
function urlImagen(ruta) {
  if (!ruta) return "";
  return iniciarSupabase().storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}
function escapar(texto) {
  const d = document.createElement("div");
  d.textContent = texto ?? "";
  return d.innerHTML;
}
function formatoFecha(f) {
  if (!f) return "Fecha por confirmar";
  return new Date(f + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
}