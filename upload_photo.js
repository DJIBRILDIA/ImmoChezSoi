(function(){
  var MAX = 3 * 1024 * 1024;
  var ALLOWED = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

  function readAsDataURL(file){
    return new Promise(function(res, rej){
      var r = new FileReader();
      r.onload = function(){ res(r.result); };
      r.onerror = function(){ rej(new Error("Lecture du fichier impossible.")); };
      r.readAsDataURL(file);
    });
  }

  async function upload_photo(formData){
    var file = formData.get("photo");
    if(!file) throw new Error("Aucun fichier reçu.");

    if(file.size > MAX) throw new Error("Fichier trop volumineux (max 3 Mo).");

    var type = file.type;
    if(!(type in ALLOWED)) throw new Error("Type de fichier non supporté.");

    var dataUrl = await readAsDataURL(file);

    return { url: dataUrl };
  }

  window.upload_photo = upload_photo;
})();
