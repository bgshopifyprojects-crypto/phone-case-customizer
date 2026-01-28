<?php
header("Access-Control-Allow-Origin: https://www.wolfdizayn.com");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// JSON dosyasını döndüren API
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Gelen parametreyi kontrol et
    if (isset($_GET['file'])) {
        $filePath = $_GET['file'];

        $baseDir = __DIR__ . '/data';
        $fullPath = realpath($baseDir . $filePath);

        if ($fullPath && strpos($fullPath, $baseDir) === 0 && file_exists($fullPath) && pathinfo($fullPath, PATHINFO_EXTENSION) === 'json') {
            $jsonContent = file_get_contents($fullPath);
            header('Content-Type: application/json');
            echo $jsonContent;
        } else {
            header('HTTP/1.1 404 Not Found');
            echo json_encode(["error" => "JSON file not found or invalid."]);
        }
    } else {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["error" => "Missing 'file' parameter."]);
    }
} else {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(["error" => "Only GET requests are allowed."]);
}
?>
