<?php
// CORS başlıkları
header("Access-Control-Allow-Origin: https://www.wolfdizayn.com");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Yalnızca GET isteklerini işleme al
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['file'])) {
        // Gelen parametreyi çöz
        $filePath = rawurldecode($_GET['file']);

        // Font dosyalarının bulunduğu dizin
        $baseDir = __DIR__ . '/css/fonts';

        // Tam dosya yolunu çözümle
        $fullPath = realpath($baseDir . '/' . $filePath);

        // Güvenlik ve dosya kontrolü
        if ($fullPath && strpos($fullPath, $baseDir) === 0 && file_exists($fullPath)) {
            // MIME türünü belirle
            $extension = pathinfo($fullPath, PATHINFO_EXTENSION);
            $mimeTypes = [
                'woff' => 'font/woff',
                'woff2' => 'font/woff2',
                'ttf' => 'font/ttf',
                'eot' => 'application/vnd.ms-fontobject',
                'otf' => 'font/otf',
                'svg' => 'image/svg+xml',
            ];

            // MIME türü geçerliyse dosyayı döndür
            if (isset($mimeTypes[$extension])) {
                header("Content-Type: " . $mimeTypes[$extension]);
                header("Content-Length: " . filesize($fullPath));
                readfile($fullPath);
                exit;
            } else {
                // Geçersiz dosya türü
                header('HTTP/1.1 415 Unsupported Media Type');
                echo json_encode(["error" => "Unsupported font type."]);
                exit;
            }
        } else {
            // Dosya bulunamadı
            header('HTTP/1.1 404 Not Found');
            echo json_encode(["error" => "Font file not found."]);
            exit;
        }
    } else {
        // Eksik parametre
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["error" => "Missing 'file' parameter."]);
        exit;
    }
} else {
    // Yanlış HTTP metodu
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(["error" => "Only GET requests are allowed."]);
    exit;
}
?>
