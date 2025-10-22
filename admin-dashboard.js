(function(){
    function getCookie(name){ return document.cookie.split('; ').map(v=>v.split('=')).find(([k])=>k===name)?.[1]; }
    function parseJwt(token){ try{ const p = token.split('.')[1]; return JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/'))); }catch{ return null; } }
    const token = getCookie('icss');
    if(!token){ location.replace('connexion.html?err='+encodeURIComponent('Veuillez vous connecter.')); return; }
    const payload = parseJwt(token) || {};
    document.getElementById('who').textContent = payload.sub || 'admin';
  
    // ✅ Déconnexion + redirection vers la page d’accueil
    const logout = document.getElementById('logout');
    if (logout) {
      logout.addEventListener('click', (e)=>{
        e.preventDefault();
        document.cookie = 'icss=; Path=/; Max-Age=0; SameSite=Lax';
        // Redirection vers la page d'accueil
        location.replace('index.html?bye=1');
      });
    }
  
    const STORAGE_KEY = 'properties';
    function readProps(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return [] } }
    function writeProps(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
  
    (function(){
      let arr = [];
      try { arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){}
      let changed = false;
      arr.forEach(p => { if (!p.deal) { p.deal = 'acheter'; changed = true; } });
      if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    })();
  
    function formatPrice(n){ return new Intl.NumberFormat('fr-FR').format(+n||0) + ' FCFA'; }
    async function geocode(address){
      const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address);
      try{
        const res = await fetch(url, { headers:{'Accept-Language':'fr'} });
        const data = await res.json();
        if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }catch(e){}
      return null;
    }
  
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
      if (!f) { setPreview(''); photoUrlHidden.value=''; return; }
      const reader = new FileReader();
      reader.onload = ()=> { setPreview(reader.result); photoUrlHidden.value = reader.result; };
      reader.readAsDataURL(f);
    });
  
    function fillForm(p){
      document.getElementById('prop-id').value = p._id ?? '';
      ['title','address','price','type','rooms','lat','lng'].forEach(id=>{
        const el = document.getElementById(id);
        if (el) el.value = p[id] ?? '';
      });
      const dealEl = document.getElementById('deal');
      if (dealEl) dealEl.value = p.deal || 'acheter';
      photoUrlHidden.value = p.photoUrl || '';
      setPreview(p.photoUrl || '');
      document.getElementById('form-title').textContent = p._id ? 'Éditer le bien' : 'Ajouter un bien';
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
          <td><span class="badge">${p.deal || '—'}</span></td>
          <td>${p.rooms||''}</td>
          <td class="muted">${Number.isFinite(+p.lat)? (+p.lat).toFixed(5):'-'}, ${Number.isFinite(+p.lng)? (+p.lng).toFixed(5):'-'}</td>
          <td>
            <button class="btn" data-edit="${idx}" title="Éditer">✏️</button>
            <button class="btn danger" data-del="${idx}" title="Supprimer">🗑️</button>
          </td>`;
        table.appendChild(tr);
      });
    }
  
    table.addEventListener('click', (e)=>{
      const edit = e.target.closest?.('[data-edit]');
      const del  = e.target.closest?.('[data-del]');
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
  
    async function uploadPhotoIfAny(){
      var f = document.getElementById("photoFile").files?.[0];
      if(!f) return document.getElementById("photoUrl").value || "";
      var fd = new FormData();
      fd.append("photo", f);
      var data = await window.upload_photo(fd);
      return data.url;
    }
  
    function parseCoord(v){
      if (v==null) return null;
      const s = String(v).trim().replace(/,/g,'.');
      if (s==='') return null;
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : null;
    }
  
    document.getElementById('save-btn').addEventListener('click', async ()=>{
      const id = document.getElementById('prop-id').value;
      const title = document.getElementById('title').value.trim();
      const address = document.getElementById('address').value.trim();
      const price = Number(document.getElementById('price').value);
      const type = document.getElementById('type').value.trim();
      const rooms = Number(document.getElementById('rooms').value||0);
      const deal = document.getElementById('deal').value;
      let lat = document.getElementById('lat').value.trim();
      let lng = document.getElementById('lng').value.trim();
  
      if (!title || !address || !price || !type || !deal){
        alert('Veuillez renseigner Titre, Adresse, Prix, Type et Transaction.');
        return;
      }
  
      let photoUrl = '';
      try { photoUrl = await uploadPhotoIfAny(); }
      catch(e){ alert(e.message); return; }
  
      let latNum = parseCoord(lat);
      let lngNum = parseCoord(lng);
  
      if ((latNum==null || lngNum==null) && address){
        const g = await geocode(address);
        if (g){ latNum = g.lat; lngNum = g.lng; }
      }
  
      const props = readProps();
      const item = {
        title, address, price, type, rooms, photoUrl,
        lat: latNum, lng: lngNum,
        deal,
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
      document.getElementById('deal').value = 'acheter';
      setPreview('');
      alert('Bien enregistré ✅');
    });
  
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
  
    document.addEventListener('DOMContentLoaded', ()=>{
      render();
      document.getElementById('deal').value = 'acheter';
    });
  })();
  