$(document).ready(function(){
    $('.slider').slick({
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        arrows: false,
        fade: true
    });
});

// Liste des utilisateurs admins (à sécuriser via un backend dans une version réelle)
const admins = [
    { username: 'admin', password: 'password123' }
];

// Gestion de la connexion admin
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const isAdmin = admins.some(admin => admin.username === username && admin.password === password);

    if (isAdmin) {
        // Stocker l'authentification dans le stockage local (session)
        localStorage.setItem('isAdmin', 'true');
        window.location.href = 'admin-dashboard.html';  // Redirection vers la page d'admin
    } else {
        document.getElementById('error-message').textContent = "Nom d'utilisateur ou mot de passe incorrect.";
    }
});

// Vérifier si l'utilisateur est authentifié
window.onload = function() {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
        alert("Accès interdit. Veuillez vous connecter en tant qu'administrateur.");
        window.location.href = 'login.html';  // Redirection vers la page de connexion
    }
};

// Gestion de l'ajout de propriété
document.getElementById('property-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const address = document.getElementById('address').value;
    const price = document.getElementById('price').value;
    const type = document.getElementById('type').value;

    // Enregistrer la nouvelle propriété (idéalement sur un serveur ou une base de données)
    const newProperty = { title, address, price, type };
    console.log("Propriété ajoutée:", newProperty);

    // Afficher un message de confirmation
    document.getElementById('message').textContent = "La propriété a été ajoutée avec succès.";
    
    // Réinitialiser le formulaire
    document.getElementById('property-form').reset();
});


let map;
let markers = [];
let autocomplete;
let infowindow;

// Exemple de biens immobiliers (ces données peuvent être récupérées d'une base de données)
const properties = [
    { id: 1, title: "Appartement Haussmannien", address: "Paris 16", lat: 48.864716, lng: 2.349014, price: 1000000, type: "appartement" },
    { id: 2, title: "Maison de campagne", address: "Versailles", lat: 48.8014, lng: 2.1301, price: 1500000, type: "maison" },
    { id: 3, title: "Villa moderne", address: "Cannes", lat: 43.552847, lng: 7.017369, price: 2500000, type: "villa" },
    // Ajoutez d'autres biens ici
];

// Initialise la carte et l'autocomplétion Google Places
function initMap() {
    // Carte centrée sur Abidjan
    const abidjan = { lat: 5.345317, lng: -4.024429 };

    // Créer la carte
    map = new google.maps.Map(document.getElementById("map"), {
        center: abidjan,
        zoom: 13
    });

    // Infobulle pour les marqueurs
    infowindow = new google.maps.InfoWindow();

    // Initialiser l'autocomplete sur la barre de recherche
    autocomplete = new google.maps.places.Autocomplete(document.getElementById("autocomplete"));
    autocomplete.setFields(['geometry', 'name', 'formatted_address']);
    
    // Quand une adresse est sélectionnée dans l'autocomplete
    autocomplete.addListener('place_changed', onPlaceChanged);
}

// Quand une adresse est sélectionnée
function onPlaceChanged() {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
        alert("Veuillez choisir une adresse valide.");
        return;
    }
    // Centrer la carte sur l'adresse sélectionnée
    map.setCenter(place.geometry.location);
    map.setZoom(15);

    // Afficher les propriétés à proximité de cette adresse
    searchProperty();
}

// Filtrer les propriétés en fonction du prix, du type de bien, et de la localisation
function searchProperty() {
    const priceFilter = document.getElementById("price-filter").value;
    const typeFilter = document.getElementById("type-filter").value;

    // Effacer les anciens marqueurs
    clearMarkers();

    // Parcourir les propriétés et filtrer selon les critères
    const filteredProperties = properties.filter(property => {
        const matchesPrice = !priceFilter || property.price <= priceFilter;
        const matchesType = !typeFilter || property.type === typeFilter;
        return matchesPrice && matchesType;
    });

    // Ajouter des marqueurs pour les propriétés filtrées
    filteredProperties.forEach(property => {
        addMarker(property);
    });
}

// Ajouter un marqueur pour une propriété donnée
function addMarker(property) {
    const marker = new google.maps.Marker({
        position: { lat: property.lat, lng: property.lng },
        map: map,
        title: property.title
    });

    // Infobulle pour afficher les détails du bien
    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(`<div><strong>${property.title}</strong><br>Prix: ${property.price}€<br>Type: ${property.type}</div>`);
        infowindow.open(map, marker);
    });

    markers.push(marker);
}

// Supprimer tous les marqueurs de la carte
function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

// Charger la carte une fois la page chargée
window.onload = initMap;


// Form submission handler
const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Récupération des valeurs du formulaire
    const propertyData = {
      title: document.getElementById('title').value,
      address: document.getElementById('address').value,
      price: document.getElementById('price').value,
      type: document.getElementById('type').value,
      photo: document.getElementById('photo').files[0],
    };
    
    try {
      // Envoi des données au backend
      const response = await fetch('/api/properties', {
        method: 'POST',
        body: JSON.stringify(propertyData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        // Recharger la liste des propriétés après ajout
        loadProperties();
      } else {
        console.error('Erreur lors de l’ajout de la propriété');
      }
    } catch (error) {
      console.error('Erreur réseau', error);
    }
  };
  
  // Fonction pour charger la liste des propriétés
  const loadProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      const properties = await response.json();
      
      // Afficher les propriétés dans le tableau
      displayProperties(properties);
    } catch (error) {
      console.error('Erreur lors de la récupération des propriétés', error);
    }
  };
  
  // Fonction pour afficher les propriétés dans la table
  const displayProperties = (properties) => {
    const propertiesTable = document.getElementById('properties-table');
    propertiesTable.innerHTML = '';  // Vider la table avant de la remplir
    
    properties.forEach((property) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${property.title}</td>
        <td>${property.address}</td>
        <td>${property.price}</td>
        <td>${property.type}</td>
        <td><img src="${property.photoUrl}" alt="Photo de la propriété" width="100"></td>
        <td><button>Supprimer</button></td>
      `;
      propertiesTable.appendChild(row);
    });
  };
  
  // Charger les propriétés au chargement de la page
  window.onload = loadProperties;
  
  