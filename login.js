document.addEventListener("DOMContentLoaded",function(){
  var form=document.getElementById("login-form");
  var msg=document.getElementById("msg");
  if(!form)return;

  function setMsg(t){ if(msg) msg.textContent=t||""; }

  var p=new URLSearchParams(location.search);
  if(p.get("err")) setMsg(p.get("err"));
  if(p.get("ok")) setMsg(p.get("ok"));

  form.addEventListener("submit",function(e){
    e.preventDefault();
    setMsg("");

    var username=(form.username.value||"").trim();
    var password=(form.password.value||"").trim();
    if(!username||!password){ setMsg("Veuillez entrer vos identifiants."); return; }

    var adminUser="admin";
    var adminPass="1234";

    if(username===adminUser&&password===adminPass){
      var payload={sub:username,exp:(Date.now()/1000)+3600};
      var token=btoa(JSON.stringify(payload));
      document.cookie="icss="+token+"; Path=/; SameSite=Lax";
      location.replace("admin.html");
    }else{
      setMsg("Nom d’utilisateur ou mot de passe invalide.");
    }
  });
});
