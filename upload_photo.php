<?php
// upload_photo.php — upload sécurisé d'image vers /uploads
declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);

$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
  http_response_code(500);
  exit('Impossible de créer le dossier uploads/');
}

if (empty($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
  http_response_code(400);
  exit('Aucun fichier reçu.');
}

$f = $_FILES['photo'];
if ($f['size'] > 3 * 1024 * 1024) { // 3 Mo
  http_response_code(413);
  exit('Fichier trop volumineux (max 3 Mo).');
}

// Vérifie le type MIME sur le contenu
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($f['tmp_name']);
$allowed = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
if (!isset($allowed[$mime])) {
  http_response_code(415);
  exit('Type de fichier non supporté.');
}

$name = bin2hex(random_bytes(8)) . '.' . $allowed[$mime];
$target = $uploadDir . '/' . $name;

if (!move_uploaded_file($f['tmp_name'], $target)) {
  http_response_code(500);
  exit('Échec de l’upload.');
}

// URL publique
$url = 'uploads/' . $name;

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['url' => $url], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
