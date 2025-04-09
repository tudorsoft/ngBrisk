<?php
//doar pt testare
ini_set('display_errors', 1);
error_reporting(E_ALL);
//doar pt testare


// Verifică dacă parametrul 'api' este setat (din query string)
if (!isset($_GET['api'])) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(["error" => "Missing 'api' parameter."]);
    exit;
}

$apiUrl = urldecode($_GET['api']);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = file_get_contents('php://input');
    if (!empty($data)) {
        $jsonBody = json_decode( $data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode(["error" => "Invalid JSON received."]);
            exit;
        }
    } else {
        $jsonBody = []; // sau poți seta la null, în funcție de nevoi
    }
} else {
    $jsonBody = [];  // Pentru GET sau alte metode fără body
}


// Determină dacă cererea este de tip autocomplete
if ($method === 'POST' && $jsonBody && isset($jsonBody['autocomplete']) ) {
    $sql = isset($jsonBody['sql']) ? $jsonBody['sql'] : '';
    if (trim($sql) === '') {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(["error" => "Missing 'sql' parameter."]);
        exit;
    }
    $jsonBody = ['sql' => $sql];
} 

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

$urlEncodedData = json_encode($jsonBody);
if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $urlEncodedData );
}

curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
    'Accept: application/json'
]);

$response = curl_exec($ch);
if ($response === false) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["error" => curl_error($ch)]);
    curl_close($ch);
    exit;
}
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
echo $response;

?>