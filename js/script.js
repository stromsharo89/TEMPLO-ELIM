// ==========================================
// MENÚ PARA CELULAR (funciona con abrirMenu() y mostrarMenu())
// ==========================================
function abrirMenu() {
    const nav = document.querySelector("header nav");
    if (nav) nav.classList.toggle("mostrar");
}
const mostrarMenu = abrirMenu;

// Cierra el menú al tocar un enlace
document.querySelectorAll("header nav a").forEach(function (enlace) {
    enlace.addEventListener("click", function () {
        const nav = document.querySelector("header nav");
        if (nav) nav.classList.remove("mostrar");
    });
});

// Sombra en el header al bajar
window.addEventListener("scroll", function () {
    const header = document.querySelector(".header");
    if (header) header.classList.toggle("scroll", window.scrollY > 10);
});

// ==========================================
// FORMULARIO DE CONTACTO
// ==========================================
const formContacto = document.getElementById("formContacto");
if (formContacto) {
    formContacto.addEventListener("submit", function (event) {
        event.preventDefault();
        const nombre = document.getElementById("nombre").value;
        alert("¡Gracias " + nombre + "! Tu mensaje fue recibido. La conexión con la base de datos se agregará posteriormente.");
        formContacto.reset();
    });
}

// ==========================================
// LOGIN
// ==========================================
const formLogin = document.getElementById("formLogin");
if (formLogin) {
    formLogin.addEventListener("submit", function (event) {
        event.preventDefault();
        const correo = document.getElementById("loginCorreo").value;
        alert("Intento de inicio de sesión con: " + correo + "\n\nLa base de datos y autenticación se conectarán posteriormente.");
    });
}

// ==========================================
// GALERÍA: VER FOTO AMPLIADA
// ==========================================
const visor = document.getElementById("visor");
if (visor) {
    const imgVisor = visor.querySelector("img");
    document.querySelectorAll("#galeriaFotos img").forEach(function (img) {
        img.addEventListener("click", function () {
            imgVisor.src = img.src;
            imgVisor.alt = img.alt;
            visor.classList.add("abierto");
        });
    });
    visor.addEventListener("click", function () { visor.classList.remove("abierto"); });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") visor.classList.remove("abierto");
    });
}