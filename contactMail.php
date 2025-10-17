<?php
// contactMail.php — version sécurisée
// ⚠️ Assurez-vous que la fonction mail() est active sur votre hébergement.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Méthode non autorisée');
}

// Anti-spam simple (honeypot)
if (!empty($_POST['company'])) { // champ caché ajouté dans le formulaire
    http_response_code(200);
    exit('OK');
}

function sanitize($v) {
    $v = trim($v ?? '');
    $v = preg_replace('/[\r\n]+/', ' ', $v); // évite l’injection d’entêtes
    return htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$name  = sanitize($_POST['name']  ?? '');
$email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
$phone = sanitize($_POST['phone'] ?? '');
$msg   = sanitize($_POST['message'] ?? '');

if (!$name || !$email || !$msg) {
    http_response_code(422);
    exit('Veuillez renseigner nom, email et message.');
}

// ➜ METTEZ ICI VOTRE ADRESSE DE RECEPTION
$to      = 'contact@immochezsoi.com';

$subject = "Nouveau message depuis ImmoChezSoi — $name";
$body    = "Nom: $name\nEmail: $email\nTéléphone: $phone\n\nMessage:\n$msg\n";
$headers = "From: ImmoChezSoi <no-reply@votre-domaine.ci>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

if (mail($to, $subject, $body, $headers)) {
    echo 'Message envoyé, merci !';
} else {
    http_response_code(500);
    echo 'Désolé, l’envoi a échoué. Réessayez plus tard.';
}
