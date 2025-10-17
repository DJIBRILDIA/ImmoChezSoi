<?php // connexion.php ?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion — ImmoChezSoi</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root{--bg:#f6f5f3;--paper:#fff;--ink:#1d1d1f;--muted:#6e6e73;--shadow:0 18px 50px rgba(0,0,0,.08)}
    *{box-sizing:border-box} body{margin:0;font-family:Inter,system-ui,Arial,sans-serif;background:var(--bg);color:var(--ink)}
    .wrap{min-height:100dvh;display:grid;place-items:center;padding:24px}
    .card{width:min(420px,92%);background:var(--paper);border-radius:14px;box-shadow:var(--shadow);padding:22px 20px}
    h1{margin:6px 0 16px;font-size:22px}
    label{display:block;font-weight:600;margin:10px 0 6px}
    input{width:100%;border:1px solid #ddd;border-radius:10px;padding:12px;font-size:16px}
    .cta{margin-top:14px;width:100%;border:0;border-radius:10px;background:#222;color:#fff;padding:12px 14px;font-weight:700;cursor:pointer}
    .msg{margin-top:10px;color:var(--muted);min-height:1.2em}
    .brand{display:block;text-align:center;margin-bottom:8px;text-decoration:none;color:inherit;font-weight:700}
  </style>
</head>
<body>
  <div class="wrap">
    <form class="card" action="login.php" method="POST" autocomplete="on" novalidate>
      <a class="brand" href="index.html">ImmoChezSoi</a>
      <h1>Connexion</h1>

      <label for="username">Nom d’utilisateur</label>
      <input id="username" name="username" type="text" required autocomplete="username" placeholder="Votre identifiant">

      <label for="password">Mot de passe</label>
      <input id="password" name="password" type="password" required autocomplete="current-password" placeholder="Votre mot de passe">

      <button class="cta" type="submit">Se connecter</button>
      <div class="msg">
        <?php
          if (!empty($_GET['err'])) echo htmlspecialchars($_GET['err']);
          if (!empty($_GET['ok']))  echo htmlspecialchars($_GET['ok']);
        ?>
      </div>
    </form>
  </div>
</body>
</html>
