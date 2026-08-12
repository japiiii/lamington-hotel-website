<?php
header('Content-Type: application/json');

require_once __DIR__ . '/db-config.php';

function views_fail($code, $message) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

$providedKey = $_SERVER['HTTP_X_API_KEY'] ?? ($_GET['key'] ?? '');

if (!is_string($providedKey) || $providedKey === '' || !hash_equals(API_SECRET, $providedKey)) {
    views_fail(401, 'Invalid or missing API key.');
}

$sinceId = isset($_GET['since_id']) ? max(0, (int) $_GET['since_id']) : 0;
$limit = isset($_GET['limit']) ? min(1000, max(1, (int) $_GET['limit'])) : 500;

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare(
        'SELECT id, path, referrer, created_at
         FROM page_views
         WHERE id > :since_id
         ORDER BY id ASC
         LIMIT ' . (int) $limit
    );
    $stmt->execute([':since_id' => $sinceId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $lastId = $sinceId;
    foreach ($rows as $row) {
        $lastId = max($lastId, (int) $row['id']);
    }

    echo json_encode([
        'success' => true,
        'views' => $rows,
        'last_id' => $lastId,
    ]);
} catch (Throwable $e) {
    error_log('views-api failed: ' . $e->getMessage());
    views_fail(500, 'Could not retrieve views.');
}
