<?php

// config.php ve functions.php dosyalarını dahil et
require_once 'config.php';
require_once 'functions.php';

// Gelen istek kontrolü
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : null;

    if ($action === '1') {
        // Access token'i al
        $access_token = getAccessToken();
        if (!$access_token) {
            echo json_encode(['error' => 'Access token alınamadı.']);
            exit;
        }

        // Product ID kontrolü
        $product_id = isset($_POST['product_id']) ? $_POST['product_id'] : null;
        if (!$product_id) {
            echo json_encode(['error' => 'Ürün ID belirtilmemiş.']);
            exit;
        }

        // Ürün bilgilerini çek
        $response = getIdeaProduct($product_id, $access_token);

        // Sonucu JSON olarak döndür
        echo json_encode([
            'status' => $response['status'],
            'body' => json_decode($response['body'], true)
        ]);
    } else {
        echo json_encode(['error' => 'Geçersiz action değeri.']);
    }
} else {
    echo json_encode(['error' => 'Geçersiz istek türü. Sadece POST destekleniyor.']);
}
