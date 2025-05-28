// Configuración de Supabase
const supabaseUrl = 'https://zrywjaktcwtuncdjtyiy.supabase.co'; // reemplaza con tu URL real
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyeXdqYWt0Y3d0dW5jZGp0eWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MzMyNDIsImV4cCI6MjA2NDAwOTI0Mn0.50P4Zlv5UmrdzCoeQ_QH8YchaX0hey6SAoBSK8a1PYc'; // reemplaza con tu API KEY real
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Estado actual
let ciudadActualSlug = "bogota";
let ciudades = [];

document.addEventListener("DOMContentLoaded", async () => {
  ciudades = await obtenerCiudades();
  await cargarCartelera(ciudadActualSlug);
});

// Obtener ciudades desde la base de datos
async function obtenerCiudades() {
  const { data, error } = await supabase.from("cities").select("*");
  if (error) {
    console.error("Error obteniendo ciudades:", error);
    return [];
  }
  return data;
}

// Cambiar ciudad y recargar cartelera
window.cambiarCiudad = async function (slug) {
  ciudadActualSlug = slug;
  await cargarCartelera(slug);
}

// Cargar cartelera de películas por ciudad
async function cargarCartelera(slugCiudad) {
  const ciudad = ciudades.find(c => c.slug === slugCiudad);
  if (!ciudad) {
    document.getElementById("app").innerHTML = "<p>Ciudad no encontrada.</p>";
    return;
  }

  const { data, error } = await supabase
    .from("showtimes")
    .select(`
      id,
      show_date,
      show_time,
      movies (
        title, genre, image_url, duration, rating, is_presale
      )
    `)
    .eq("city_id", ciudad.id);

  if (error) {
    console.error("Error cargando cartelera:", error);
    document.getElementById("app").innerHTML = "<p>Error cargando cartelera.</p>";
    return;
  }

  const carteleraHTML = generarCarteleraHTML(data);
  document.getElementById("app").innerHTML = `
    <h2 class="titulo-ciudad">Cartelera - ${ciudad.name}</h2>
    <section class="c-lista">${carteleraHTML}</section>
  `;
}

// Generar HTML para las películas
function generarCarteleraHTML(lista) {
  const agrupadas = new Map();

  lista.forEach(item => {
    const key = item.movies.title;
    if (!agrupadas.has(key)) agrupadas.set(key, []);
    agrupadas.get(key).push(item);
  });

  return Array.from(agrupadas.entries()).map(([titulo, funciones]) => {
    const movie = funciones[0].movies;
    const funcionesHTML = funciones.map(f =>
      `<span>${f.show_date} - ${f.show_time.slice(0, 5)}</span>`
    ).join(" ");
    return `
      <div class="c-lista-pelicula">
        <img src="${movie.image_url}" alt="${titulo}" height="120">
        <h3>${titulo}</h3>
        <p>${movie.genre} | ${movie.duration} min | ${movie.rating}</p>
        <p>${movie.is_presale ? "🎟️ Preventa disponible" : "🎬 En cartelera"}</p>
        <div class="funciones">${funcionesHTML}</div>
      </div>
    `;
  }).join("");
}
