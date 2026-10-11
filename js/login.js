document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formLogin");
  const mensaje = document.getElementById("mensajeLogin");
  if (!formulario) return;
  const decir = (t, tipo = "") => { mensaje.textContent = t; mensaje.className = "mensaje " + tipo; };

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value;
    decir("Verificando acceso...");
    try {
      const db = iniciarSupabase();
      const { data, error } = await db.auth.signInWithPassword({ email: correo, password });
      if (error) return decir("Correo o contraseña incorrectos.", "error");

      const { data: admin, error: errorAdmin } = await db
        .from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
      if (errorAdmin || !admin) {
        await db.auth.signOut();
        return decir("Esta cuenta no tiene permisos de administrador.", "error");
      }
      window.location.href = "admin.html";
    } catch (e) {
      console.error(e);
      decir("No se pudo conectar. Revisa la configuración de Supabase.", "error");
    }
  });
});