<?php
require_once __DIR__ . '/db-config.php';

function track_fail() {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    track_fail();
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    track_fail();
}

function track_sanitize_path($value) {
    $value = trim((string) $value);
    if ($value === '') {
        return '/';
    }
    // Strip any scheme/host a caller might send — store the path only.
    $parts = parse_url($value);
    $path = $parts['path'] ?? '/';
    $path = preg_replace('/[\r\n]+/', '', $path);
    return mb_substr($path, 0, 255);
}

function track_sanitize_referrer($value) {
    $value = trim((string) $value);
    if ($value === '') {
        return null;
    }
    $value = preg_replace('/[\r\n]+/', '', $value);
    return mb_substr($value, 0, 255);
}

$path = track_sanitize_path($data['path'] ?? '/');
$referrer = track_sanitize_referrer($data['referrer'] ?? '');

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $stmt = $pdo->prepare('INSERT INTO page_views (path, referrer) VALUES (:path, :referrer)');
    $stmt->execute([':path' => $path, ':referrer' => $referrer]);
} catch (Throwable $e) {
    error_log('track.php failed: ' . $e->getMessage());
}

http_response_code(204);
