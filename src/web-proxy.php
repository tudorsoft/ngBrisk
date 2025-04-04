<?php
if (!isset($_GET['api'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing 'api' parameter."]);
    exit;
}

$apiUrl = urldecode($_GET['api']);

// Preluare date din request (metodă, body, headere) – aceasta poate fi extinsă după necesități
$method = $_SERVER['REQUEST_METHOD'];
$data = file_get_contents('php://input');

// Inițializează cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Dacă metoda este POST, trimite body-ul
if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
}

// Opțional: setează headerele, timeout-ul etc.
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Setează codul de status corespunzător și transmite răspunsul
http_response_code($httpCode);
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
echo $response;
?>