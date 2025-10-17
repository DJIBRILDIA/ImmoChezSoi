// script-leaflet.js — version clean (pas de carte auto, pas de geocoder visible)
let map;
let markers = [];
let properties = [];

// Charger les propriétés stockées (localStorage)
function loadPropertiesFromStorage() {
  try {
    const saved = localStorage.getItem('properties') || '[]';
    properties = JSON.parse(saved);
  } catch (e) {
    console.error('Impossible de lire les propriétés', e);
    properties = [];
  }
}

// Nettoyer les marqueurs
function clearMarkers() {
  if (!markers.length) return;
  markers.forEach(m => m.remove && m.remove()); // Leaflet 1.x
  markers = [];
}

// Afficher des marqueurs pour une liste de propriétés
function renderMarkers(list) {
  if (!map) return;
  clearMarkers();
  list.forEach((p) => {
    if (!p.lat || !p.lng) return;
    const marker = L.marker([+p.lat, +p.lng]).addTo(map);
    const price = new Intl.NumberFormat('fr-FR').format(+p.price || 0);
    marker.bindPopup(`
      <strong>${p.title || 'Bien immobilier'}</strong><br/>
      ${p.address || ''}<br/>
      ${price} FCFA<br/>
      ${p.type || ''}
    `);
    markers.push(marker);
  });
}

// Filtrer en fonction du prix / type
function searchAndRender() {
  const priceMaxEl = document.getElementById('price-filter');
  const typeEl = document.getElementById('type-filter');

  const priceMax = priceMaxEl ? priceMaxEl.value : '';
  const type = typeEl ? typeEl.value : '';

  const filtered = properties.filter(p => {
    const okPrice = !priceMax || (Number(p.price) <= Number(priceMax));
    const okType = !type || (p.type === type);
    return okPrice && okType;
  });

  renderMarkers(filtered);
}

// Initialiser la carte **seulement si** #map existe déjà dans le DOM
function initMapIfPresent() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return; // rien à faire sur cette page

  // Charger Leaflet si besoin (une seule fois)
  const ensureLeaflet = () => new Promise((resolve) => {
    if (window.L && L.map) return resolve();
    const lcss = document.createElement('link');
    lcss.rel = 'stylesheet';
    lcss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(lcss);
    const ljs = document.createElement('script');
    ljs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    ljs.onload = () => resolve();
    document.body.appendChild(ljs);
  });

  ensureLeaflet().then(() => {
    map = L.map(mapEl).setView([5.345317, -4.024429], 12); // Abidjan

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // PAS de geocoder ici → donc pas de petite barre de recherche à l'écran

    loadPropertiesFromStorage();
    searchAndRender();

    // Bouton Rechercher (si présent sur la page)
    const btn = document.getElementById('btn-search');
    if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); searchAndRender(); });
  });
}

// Rendre publique la fonction de recherche (utilisée par la home)
window.searchAndRender = searchAndRender;

// Lancer à la fin du chargement
document.addEventListener('DOMContentLoaded', initMapIfPresent);
