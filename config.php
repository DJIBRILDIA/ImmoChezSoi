<?php
// config.php — DB + session de l’app
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    // Cookies de session un peu plus stricts
    session_set_cookie_params([
        'httponly' => true,
        'secure'   => isset($_SERVER['HTTPS']), // true en prod HTTPS
        'samesite' => 'Lax',
    ]);
    session_start();
}

// Assure-toi que le dossier data/ existe et est accessible en écriture
$dbDir = __DIR__ . '/data';
if (!is_dir($dbDir)) { mkdir($dbDir, 0755, true); }

$dbPath = $dbDir . '/app.db';

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Renforce un poil SQLite
    $pdo->exec('PRAGMA foreign_keys = ON');
} catch (Throwable $e) {
    http_response_code(500);
    exit('Erreur de connexion à la base.');
}

// Petite fonction utilitaire
function is_logged_in(): bool {
    return !empty($_SESSION['user_id']);
}
