(function(){
  // --- Auth / session ---
  function getCookie(name){
    return document.cookie
      .split("; ")
      .map(v => v.split("="))
      .find(([k]) => k === name)?.[1];
  }

  function parseJwt(token){
    try{
      const p = token.split(".")[1];
      return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
    }catch{
      return null;
    }
  }

  const token = getCookie("icss");
  if (!token){
    location.replace("connexion.html?err=" + encodeURIComponent("Veuillez vous connecter."));
    return;
  }
  const payload = parseJwt(token) || {};
  document.getElementById("who").textContent = payload.sub || "admin";

  // Déconnexion
  const logout = document.getElementById("logout");
  if (logout){
    logout.addEventListener("click", (e)=>{
      e.preventDefault();
      document.cookie = "icss=; Path=/; Max-Age=0; SameSite=Lax";
      location.replace("index.html?bye=1");
    });
  }

  // --- LocalStorage helpers ---
  const STORAGE_KEY = "properties";

  function readProps(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }catch(e){
      return [];
    }
  }

  function writeProps(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // Migration ancienne donnée sans "deal"
  (function(){
    let arr = [];
    try{
      arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }catch(e){}
    let changed = false;
    arr.forEach(p => {
      if (!p.deal){
        p.deal = "acheter";
        changed = true;
      }
    });
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  })();

  function formatPrice(n){
    return new Intl.NumberFormat("fr-FR").format(+n || 0) + " FCFA";
  }

  async function geocode(address){
    const url = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(address);
    try{
      const res = await fetch(url, { headers:{ "Accept-Language":"fr" } });
      const data = await res.json();
      if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }catch(e){}
    return null;
  }

  // --- DOM refs ---
  const table        = document.getElementById("properties-table");
  const resetBtn     = document.getElementById("reset-btn");
  const photoFiles   = document.getElementById("photoFiles");
  const photosJson   = document.getElementById("photosJson");
  const photoPreview = document.getElementById("photoPreview");

  // --- Preview multi-images ---
  function setPreview(urls){
    if (!photoPreview) return;
    if (!urls || !urls.length){
      photoPreview.innerHTML = '<span class="muted">Aucune image</span>';
      return;
    }
    photoPreview.innerHTML = urls
      .map(u => `<img alt="Prévisualisation" src="${u}">`)
      .join("");
  }

  // Quand on sélectionne de nouvelles images : preview locale
  if (photoFiles){
    photoFiles.addEventListener("change", ()=>{
      const files = photoFiles.files;
      if (!files || !files.length){
        // si annulation → revenir à la galerie existante
        try{
          const arr = JSON.parse(photosJson.value || "[]");
          setPreview(arr);
        }catch{
          setPreview([]);
        }
        return;
      }

      const urls = [];
      Array.from(files).forEach(file =>{
        const reader = new FileReader();
        reader.onload = (e)=>{
          urls.push(e.target.result);
          if (urls.length === files.length){
            setPreview(urls);
          }
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // --- Remplir le formulaire à partir d'un bien existant ---
  function fillForm(p){
    document.getElementById("prop-id").value = p._id ?? "";

    ["title","address","price","type","rooms","lat","lng"].forEach(id=>{
      const el = document.getElementById(id);
      if (el) el.value = p[id] ?? "";
    });

    const dealEl = document.getElementById("deal");
    if (dealEl) dealEl.value = p.deal || "acheter";

    // Galerie : photos[] ou fallback sur photoUrl
    const gallery = p.photos || p.gallery || (p.photoUrl ? [p.photoUrl] : []);
    if (photosJson) photosJson.value = JSON.stringify(gallery);
    setPreview(gallery);

    // Vidéos
    const videosEl = document.getElementById("videos");
    if (videosEl) videosEl.value = (p.videos || []).join("\n");

    document.getElementById("form-title").textContent = p._id ? "Éditer le bien" : "Ajouter un bien";

    if (photoFiles) photoFiles.value = "";
  }

  // --- Affichage du tableau ---
  function render(){
    const props = readProps().sort((a,b)=> (b.createdAt || 0) - (a.createdAt || 0));
    table.innerHTML = "";
    props.forEach((p, idx)=>{
      const tr = document.createElement("tr");
      const mainPhoto = (p.photos && p.photos[0]) || p.photoUrl;
      const thumb = mainPhoto
        ? `<img src="${mainPhoto}" alt="" style="width:64px;height:48px;object-fit:cover;border-radius:6px">`
        : '<span class="muted">—</span>';

      tr.innerHTML = `
        <td>${thumb}</td>
        <td><strong>${p.title || ""}</strong></td>
        <td>${p.address || ""}</td>
        <td>${formatPrice(p.price)}</td>
        <td><span class="badge">${p.type || ""}</span></td>
        <td><span class="badge">${p.deal || "—"}</span></td>
        <td>${p.rooms || ""}</td>
        <td class="muted">
          ${Number.isFinite(+p.lat) ? (+p.lat).toFixed(5) : "-"},
          ${Number.isFinite(+p.lng) ? (+p.lng).toFixed(5) : "-"}
        </td>
        <td>
          <button class="btn" data-edit="${idx}" title="Éditer">✏️</button>
          <button class="btn danger" data-del="${idx}" title="Supprimer">🗑️</button>
        </td>`;
      table.appendChild(tr);
    });
  }

  // --- Click sur éditer / supprimer ---
  table.addEventListener("click", (e)=>{
    const edit = e.target.closest?.("[data-edit]");
    const del  = e.target.closest?.("[data-del]");
    const props = readProps();

    if (edit){
      const idx = +edit.getAttribute("data-edit");
      const p = { ...props[idx], _id: String(idx) };
      fillForm(p);
      window.scrollTo({ top:0, behavior:"smooth" });
    }

    if (del){
      const idx = +del.getAttribute("data-del");
      if (confirm("Supprimer ce bien ?")){
        props.splice(idx, 1);
        writeProps(props);
        render();
      }
    }
  });

  // --- Upload multi-photos via upload_photo.js ---
  async function uploadPhotosIfAny(){
    const input = document.getElementById("photoFiles");
    const files = input?.files;

    // Pas de nouveau fichier → garder la galerie existante
    if (!files || !files.length){
      try{
        const arr = JSON.parse(document.getElementById("photosJson").value || "[]");
        return Array.isArray(arr) ? arr : [];
      }catch{
        return [];
      }
    }

    const urls = [];
    for (const f of files){
      const fd = new FormData();
      fd.append("photo", f);
      const data = await window.upload_photo(fd); // doit renvoyer { url }
      urls.push(data.url);
    }
    return urls;
  }

  function parseCoord(v){
    if (v == null) return null;
    const s = String(v).trim().replace(/,/g, ".");
    if (s === "") return null;
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  // --- Enregistrement du bien ---
  document.getElementById("save-btn").addEventListener("click", async ()=>{
    const id      = document.getElementById("prop-id").value;
    const title   = document.getElementById("title").value.trim();
    const address = document.getElementById("address").value.trim();
    const price   = Number(document.getElementById("price").value);
    const type    = document.getElementById("type").value.trim();
    const rooms   = Number(document.getElementById("rooms").value || 0);
    const deal    = document.getElementById("deal").value;
    let lat       = document.getElementById("lat").value.trim();
    let lng       = document.getElementById("lng").value.trim();

    if (!title || !address || !price || !type || !deal){
      alert("Veuillez renseigner Titre, Adresse, Prix, Type et Transaction.");
      return;
    }

    // Vidéos : une URL par ligne
    const videosRaw = (document.getElementById("videos")?.value || "").trim();
    const videos = videosRaw
      ? videosRaw.split("\n").map(s => s.trim()).filter(Boolean)
      : [];

    // Upload photos éventuelles
    let photos = [];
    try{
      photos = await uploadPhotosIfAny();
    }catch(e){
      alert(e.message || "Erreur lors de l’envoi des images");
      return;
    }
    const photoUrl = photos[0] || ""; // première image = vignette / compat

    let latNum = parseCoord(lat);
    let lngNum = parseCoord(lng);

    if ((latNum == null || lngNum == null) && address){
      const g = await geocode(address);
      if (g){
        latNum = g.lat;
        lngNum = g.lng;
      }
    }

    const props = readProps();
    const item = {
      title,
      address,
      price,
      type,
      rooms,
      photoUrl, 
      photos,
      videos,
      lat: latNum,
      lng: lngNum,
      deal,
      createdAt: Date.now()
    };

    if (id !== ""){
      const idx = Number(id);
      if (!Number.isNaN(idx) && props[idx]){
        props[idx] = { ...props[idx], ...item };
      }
    } else {
      props.push(item);
    }

    writeProps(props);
    render();

    // Reset formulaire
    document.getElementById("property-form").reset();
    document.getElementById("prop-id").value = "";
    document.getElementById("deal").value = "acheter";
    if (photosJson) photosJson.value = "[]";
    const videosEl = document.getElementById("videos");
    if (videosEl) videosEl.value = "";
    setPreview([]);

    alert("Bien enregistré ✅");
  });

  // --- Réinitialisation manuelle ---
  if (resetBtn){
    resetBtn.addEventListener("click", ()=>{
      document.getElementById("property-form").reset();
      document.getElementById("prop-id").value = "";
      document.getElementById("deal").value = "acheter";
      if (photosJson) photosJson.value = "[]";
      const videosEl = document.getElementById("videos");
      if (videosEl) videosEl.value = "";
      setPreview([]);
    });
  }

  // --- Export / Import / Clear ---
  document.getElementById("export-btn").addEventListener("click", ()=>{
    const data = JSON.stringify(readProps(), null, 2);
    const blob = new Blob([data], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "properties.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById("import-file").addEventListener("change", async (e)=>{
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try{
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error("Format invalide");
      arr.forEach(p => { if (!p.deal) p.deal = "acheter"; });
      writeProps(arr);
      render();
      alert("Import terminé ✅");
    }catch(err){
      alert("Import invalide : " + err.message);
    }finally{
      e.target.value = "";
    }
  });

  document.getElementById("clear-btn").addEventListener("click", ()=>{
    if (confirm("Vider tous les biens ?")){
      writeProps([]);
      render();
    }
  });

  // --- Init ---
  document.addEventListener("DOMContentLoaded", ()=>{
    render();
    document.getElementById("deal").value = "acheter";
    if (photosJson) photosJson.value = "[]";
    setPreview([]);
  });

})();
