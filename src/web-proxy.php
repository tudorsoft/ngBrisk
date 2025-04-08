<?php
// Verifică dacă parametrul 'api' este setat (din query string)
if (!isset($_GET['api'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing 'api' parameter."]);
    exit;
}

$apiUrl = urldecode($_GET['api']);
$method = $_SERVER['REQUEST_METHOD'];

// Dacă metoda este POST, decodifică corpul JSON
$data = file_get_contents('php://input');
$jsonBody = null;
if ($method === 'POST') {
    $jsonBody = json_decode($data, true);
}

// Determină dacă cererea este de tip autocomplete
$isAutoComplete = false;
if ($method === 'POST' && $jsonBody && isset($jsonBody['autocomplete']) ) { //&& $jsonBody['autocomplete'] === true) {
    $isAutoComplete = true;
} else if (isset($_GET['autocomplete'])) {
    // Suport legacy GET pentru autocomplete, dacă este necesar
    $isAutoComplete = true;
}

if ($isAutoComplete === true) {
    // Extrage parametrii din corpul JSON dacă metoda e POST, altfel din GET
    if ($method === 'POST' && $jsonBody) {
        $sql = urldecode( $jsonBody['sql'] ?? '' );
    }
    
    if ($sql === '') {
        http_response_code(400);
        echo json_encode(["error" => "Missing 'sql' parameter."]);
        exit;
    }
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
echo $response;

?>