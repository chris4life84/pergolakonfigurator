<?php
declare(strict_types=1);

// Einfacher Datei-basierter Snapshot-Endpunkt
// POST  -> speichert JSON unter /s/<id>.json und liefert view/raw URLs zurück
// GET   -> liefert gespeicherten Snapshot (?id=<id> oder /s/<id>.json direkt)

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$storageDir = __DIR__;

// Basis-URL des Konfigurators (z. B. https://modul-garten.de/pergolakonfigurator)
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
// Eine Ebene über /s
$configBasePath = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
$configBaseUrl = rtrim($scheme . '://' . $host . $configBasePath, '/');

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id parameter missing']);
        exit;
    }
    $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$id);
    $file = $storageDir . DIRECTORY_SEPARATOR . $safeId . '.json';
    if (!is_file($file)) {
        http_response_code(404);
        echo json_encode(['error' => 'not found']);
        exit;
    }
    $json = file_get_contents($file);
    if ($json === false) {
        http_response_code(500);
        echo json_encode(['error' => 'could not read snapshot']);
        exit;
    }
    header('Content-Type: application/json');
    echo $json;
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method not allowed']);
    exit;
}

$rawInput = file_get_contents('php://input') ?: '';
$decoded = json_decode($rawInput, true);
if (!is_array($decoded)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid JSON body']);
    exit;
}

// Payload finden
$payload = $decoded['payload'] ?? $decoded['config'] ?? $decoded;
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'payload missing']);
    exit;
}

// ID generieren
$id = bin2hex(random_bytes(6));
$filename = $storageDir . DIRECTORY_SEPARATOR . $id . '.json';

// Share-Metadaten ergänzen
$createdAt = gmdate('c');
$payload['share'] = [
    'id' => $id,
    'createdAt' => $createdAt,
    'viewUrl' => $configBaseUrl . '/?share=' . $id,
    'rawUrl' => $configBaseUrl . '/s/' . $id . '.json'
];

$jsonToStore = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
if ($jsonToStore === false) {
    http_response_code(500);
    echo json_encode(['error' => 'could not encode snapshot']);
    exit;
}

if (file_put_contents($filename, $jsonToStore) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'could not write snapshot']);
    exit;
}

echo json_encode([
    'ok' => true,
    'id' => $id,
    'viewUrl' => $payload['share']['viewUrl'],
    'rawUrl' => $payload['share']['rawUrl'],
    'storedAt' => $createdAt
], JSON_UNESCAPED_SLASHES);
