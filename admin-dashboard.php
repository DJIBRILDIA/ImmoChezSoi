<?php
// admin-dashboard.php — Dashboard complet (upload fichier + géocodage + import/export)
// Protégé par session (nécessite config.php)
declare(strict_types=1);
require __DIR__ . '/config.php';

// DEV: afficher les erreurs (désactive en prod)
ini_set('display_errors', '1');
error_reporting(E_ALL);

// Auth
if (empty($_SESSION['user_id'])) {
  header('Location: connexion.php?err=' . urlencode('Veuillez vous connecter.'));
  exit;
}
?><!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin — ImmoChezSoi</title>
<link rel="stylesheet" href="style.css">
<style>
  :root{--ink:#1d1d1f;--muted:#6e6e73;--bg:#f7f7f7;--paper:#fff;--line:#eaeaea}
  body{background:var(--bg);color:var(--ink);margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
  .topbar{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#111;color:#fff}
  .topbar a{color:#fff;text-decoration:none}
  .wrap{max-width:1200px;margin:18px auto;padding:0 16px}
  .grid{display:grid;grid-template-columns:1fr;gap:18px}
  @media (min-width: 980px){ .grid{grid-template-columns: 380px 1fr} }
  .card{background:var(--paper);border:1px solid var(--line);border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.06);padding:16px}
  h1{margin:8px 0 6px}
  h2{margin:0 0 10px;font-size:18px}
  label{display:block;font-weight:600;margin:10px 0 6px}
  input,select,textarea{width:100%;border:1px solid #ddd;border-radius:10px;padding:10px;font-size:14px}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  .btn{display:inline-block;border:1px solid #ddd;background:#fff;border-radius:10px;padding:12px;text-align:center;cursor:pointer}
  .btn.primary{background:#111;color:#fff;border-color:#111}
  .btn.danger{border-color:#d33;color:#d33}
  table{width:100%;border-collapse:collapse}
  th,td{border-bottom:1px solid #eee;padding:8px 6px;text-align:left;vertical-align:top}
  th{font-size:13px;color:var(--muted)}
  .muted{color:var(--muted)}
  .badge{display:inline-block;background:#f2f2f2;border:1px solid #e5e5e5;border-radius:999px;padding:2px 8px;font-size:12px}
  .preview{width:100%;height:180px;border:1px dashed #ddd;border-radius:12px;background:#fafafa;display:grid;place-items:center;overflow:hidden}
  .preview img{max-width:100%;max-height:100%;display:block}
  .note{color:var(--muted);font-size:12px;margin-top:6px}
</style>
</head>
<body>
  <div class="topbar">
    <div>Connecté : <strong><?php echo htmlspecialchars($_SESSION['username'] ?? ''); ?></strong></div>
    <nav>
      <a href="index.html">Accueil</a> · <a href="logout.php">Se déconnecter</a>
    </nav>
  </div>

  <div class="wrap">
    <h1>Tableau de bord</h1>
    <p class="muted">Ajoutez/éditez vos biens. Les données sont stockées dans <code>localStorage</code> sous la clé <code>properties</code> (utilisées par la home + la carte).</p>

    <div class="grid">
      <!-- FORMULAIRE -->
      <section class="card">
        <h2 id="form-title">Ajouter un bien</h2>
        <form id="property-form" onsubmit="return false;">
          <input type="hidden" id="prop-id" value="">

          <label for="title">Titre *</label>
          <input id="title" placeholder="Ex: Villa 6 pièces Rivera" required>

          <label for="address">Adresse *</label>
          <input id="address" placeholder="Quartier, ville…" required>

          <div class="row">
            <div>
              <label for="price">Prix (FCFA) *</label>
              <input id="price" type="number" min="0" step="1" placeholder="1200000" required>
            </div>
            <div>
              <label for="type">Type *</label>
              <select id="type" required>
                <option value="">— Choisir —</option>
                <option>Appartement</option>
                <option>Villa</option>
                <option>Bureau</option>
                <option>Terrain</option>
              </select>
            </div>
          </div>

          <!-- NOUVEAU : sélecteur Transaction -->
          <label for="deal">Transaction *</label>
          <select id="deal" required>
            <option value="acheter">À l’achat</option>
            <option value="louer">À la location</option>
          </select>

          <div class="row">
            <div>
              <label for="rooms">Pièces</label>
              <input id="rooms" type="number" min="0" step="1" placeholder="4">
            </div>
            <div>
              <label>Photo (upload)</label>
              <input id="photoFile" type="file" accept="image/*">
              <input id="photoUrl" type="hidden">
              <div class="preview" id="photoPreview"><span class="muted">Aucune image</span></div>
              <div class="note">Les images sont envoyées dans <code>/uploads</code> via <code>upload_photo.php</code>.</div>
            </div>
          </div>

          <div class="row">
            <div>
              <label for="lat">Latitude</label>
              <input id="lat" type="text" placeholder="auto si vide">
            </div>
            <div>
              <label for="lng">Longitude</label>
              <input id="lng" type="text" placeholder="auto si vide">
            </div>
          </div>

          <div class="actions">
            <button class="btn primary" id="save-btn">Enregistrer</button>
            <button class="btn" id="reset-btn" type="button">Réinitialiser</button>
            <span class="note">Si lat/lng vides → géocodage (Nominatim) à partir de l’adresse.</span>
          </div>
        </form>

        <h2 style="margin-top:18px">Import / Export</h2>
        <div class="actions">
          <button class="btn" id="export-btn">Exporter JSON</button>
          <label class="btn">
            Importer JSON
            <input type="file" id="import-file" accept="application/json" style="display:none">
          </label>
          <button class="btn danger" id="clear-btn">Vider tous les biens</button>
        </div>
      </section>

      <!-- LISTE -->
      <section class="card">
        <h2>Biens enregistrés</h2>
        <table>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Titre</th>
              <th>Adresse</th>
              <th>Prix</th>
              <th>Type</th>
              <!-- NOUVEAU -->
              <th>Transaction</th>
              <th>Pièces</th>
              <th>Coord.</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="properties-table"></tbody>
        </table>
        <p class="note">✏️ Éditer · 🗑️ Supprimer · L’accueil & la carte affichent automatiquement les biens.</p>
      </section>
    </div>
  </div>

<script>
/* ====== STORAGE ====== */
const STORAGE_KEY = 'properties';
function readProps(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return [] } }
function writeProps(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

/* ====== MIGRATION : ajouter deal='acheter' si manquant ====== */
(function ensureDealOnExisting(){
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){}
  let changed = false;
  arr.forEach(p => { if (!p.deal) { p.deal = 'acheter'; changed = true; } });
  if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
})();

/* ====== UTIL ====== */
function formatPrice(n){ return new Intl.NumberFormat('fr-FR').format(+n||0) + ' FCFA'; }
async function geocode(address){
  const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address);
  try{
    const res = await fetch(url, { headers:{'Accept-Language':'fr'} });
    const data = await res.json();
    if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }catch(e){ console.warn('Geocode fail', e) }
  return null;
}

/* ====== UI ====== */
const table = document.getElementById('properties-table');
const resetBtn = document.getElementById('reset-btn');
const photoFile = document.getElementById('photoFile');
const photoUrlHidden = document.getElementById('photoUrl');
const photoPreview = document.getElementById('photoPreview');

function setPreview(src){
  photoPreview.innerHTML = src ? '<img alt="Prévisualisation" src="'+src+'">' : '<span class="muted">Aucune image</span>';
}

photoFile.addEventListener('change', ()=>{
  const f = photoFile.files?.[0];
  if (!f) { setPreview(''); return; }
  const reader = new FileReader();
  reader.onload = ()=> setPreview(reader.result);
  reader.readAsDataURL(f);
});

function fillForm(p){
  document.getElementById('prop-id').value = p._id ?? '';
  ['title','address','price','type','rooms','lat','lng'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.value = p[id] ?? '';
  });
  // NOUVEAU : deal
  const dealEl = document.getElementById('deal');
  if (dealEl) dealEl.value = p.deal || 'acheter';

  // photo
  photoUrlHidden.value = p.photoUrl || '';
  setPreview(p.photoUrl || '');
  document.getElementById('form-title').textContent = p._id ? 'Éditer le bien' : 'Ajouter un bien';
  // reset input file
  photoFile.value = '';
}

function render(){
  const props = readProps().sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
  table.innerHTML = '';
  props.forEach((p, idx)=>{
    const tr = document.createElement('tr');
    const thumb = p.photoUrl ? `<img src="${p.photoUrl}" alt="" style="width:64px;height:48px;object-fit:cover;border-radius:6px">` : '<span class="muted">—</span>';
    tr.innerHTML = `
      <td>${thumb}</td>
      <td><strong>${p.title||''}</strong></td>
      <td>${p.address||''}</td>
      <td>${formatPrice(p.price)}</td>
      <td><span class="badge">${p.type||''}</span></td>
      <!-- NOUVEAU : affichage transaction -->
      <td><span class="badge">${p.deal || '—'}</span></td>
      <td>${p.rooms||''}</td>
      <td class="muted">${p.lat? (+p.lat).toFixed(5):'-'}, ${p.lng? (+p.lng).toFixed(5):'-'}</td>
      <td>
        <button class="btn" data-edit="${idx}" title="Éditer">✏️</button>
        <button class="btn danger" data-del="${idx}" title="Supprimer">🗑️</button>
      </td>`;
    table.appendChild(tr);
  });
}

table.addEventListener('click', (e)=>{
  const edit = e.target.closest('[data-edit]');
  const del  = e.target.closest('[data-del]');
  const props = readProps();

  if (edit){
    const idx = +edit.getAttribute('data-edit');
    const p = {...props[idx], _id: String(idx)};
    fillForm(p);
    window.scrollTo({top:0, behavior:'smooth'});
  }
  if (del){
    const idx = +del.getAttribute('data-del');
    if (confirm('Supprimer ce bien ?')) {
      props.splice(idx,1);
      writeProps(props);
      render();
    }
  }
});

/* ====== UPLOAD ====== */
async function uploadPhotoIfAny(){
  const f = photoFile.files?.[0];
  if (!f) return photoUrlHidden.value || '';
  const fd = new FormData();
  fd.append('photo', f);
  const res = await fetch('upload_photo.php', { method:'POST', body: fd });
  if (!res.ok) throw new Error('Upload échoué');
  const data = await res.json();
  return data.url; // ex: uploads/xxxx.jpg
}

/* ====== SAVE ====== */
document.getElementById('save-btn').addEventListener('click', async ()=>{
  const id = document.getElementById('prop-id').value;
  const title = document.getElementById('title').value.trim();
  const address = document.getElementById('address').value.trim();
  const price = Number(document.getElementById('price').value);
  const type = document.getElementById('type').value.trim();
  const rooms = Number(document.getElementById('rooms').value||0);
  const deal = document.getElementById('deal').value; // NOUVEAU
  let lat = document.getElementById('lat').value.trim();
  let lng = document.getElementById('lng').value.trim();

  if (!title || !address || !price || !type || !deal){
    alert('Veuillez renseigner Titre, Adresse, Prix, Type et Transaction.');
    return;
  }

  // upload photo si choisie
  let photoUrl = '';
  try { photoUrl = await uploadPhotoIfAny(); }
  catch(e){ alert(e.message); return; }

  // géocode si besoin
  if ((!lat || !lng) && address){
    const g = await geocode(address);
    if (g){ lat = g.lat; lng = g.lng; }
  }

  const props = readProps();
  const item = {
    title, address, price, type, rooms, photoUrl,
    lat: lat?Number(lat):null, lng: lng?Number(lng):null,
    deal,                                // NOUVEAU
    createdAt: Date.now()
  };

  if (id !== ''){
    const idx = Number(id);
    if (!Number.isNaN(idx) && props[idx]) props[idx] = {...props[idx], ...item};
  } else {
    props.push(item);
  }

  writeProps(props);
  render();
  document.getElementById('property-form').reset();
  document.getElementById('deal').value = 'acheter'; // reset par défaut
  setPreview('');
  alert('Bien enregistré ✅');
});

/* ====== IMPORT / EXPORT / CLEAR ====== */
document.getElementById('export-btn').addEventListener('click', ()=>{
  const data = JSON.stringify(readProps(), null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'properties.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import-file').addEventListener('change', async (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) throw new Error('Format invalide');
    // petit patch: si des objets importés n'ont pas "deal", on met "acheter"
    arr.forEach(p=>{ if(!p.deal) p.deal='acheter'; });
    writeProps(arr);
    render();
    alert('Import terminé ✅');
  } catch(err){
    alert('Import invalide : ' + err.message);
  } finally {
    e.target.value = '';
  }
});

document.getElementById('clear-btn').addEventListener('click', ()=>{
  if (confirm('Vider tous les biens ?')) {
    writeProps([]);
    render();
  }
});

/* INIT */
document.addEventListener('DOMContentLoaded', ()=>{
  render();
  // État initial du formulaire
  document.getElementById('deal').value = 'acheter';
});
</script>
</body>
</html>
