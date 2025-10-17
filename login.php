<?php
// login.php
declare(strict_types=1);
require __DIR__ . '/config.php';

// Pour debug provisoire (tu peux commenter après test)
ini_set('display_errors', '1');
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: connexion.php?err=' . urlencode('Méthode invalide.'));
    exit;
}

$username = trim($_POST['username'] ?? '');
$password = (string)($_POST['password'] ?? '');

if ($username === '' || $password === '') {
    header('Location: connexion.php?err=' . urlencode('Identifiants manquants.'));
    exit;
}

$stmt = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password_hash'])) {
    header('Location: connexion.php?err=' . urlencode('Nom d’utilisateur ou mot de passe invalide.'));
    exit;
}

// OK
$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['username'] = $user['username'];
session_regenerate_id(true);

// Redirection vers dashboard
header('Location: admin-dashboard.php');
exit;
