<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Ana klasörün yolu
$basePath = __DIR__ . '/data/designs'; // Ana dizin

// Genel JSON verisi için bir dizi oluştur
$allData = [];

// Klasördeki tüm klasörleri işleme
$directories = array_filter(glob($basePath . '/*'), 'is_dir');

foreach ($directories as $dir) {
    $folderName = basename($dir);
    $images = glob($dir . '/*.{jpg,jpeg,png,gif}', GLOB_BRACE);

    $folderData = [
        "title" => $folderName,
        "thumbnail" => isset($images[0]) ? generateFullUrl($images[0]) : '',
        "designs" => []
    ];

    foreach ($images as $imagePath) {
        $fileNameWithoutExt = pathinfo($imagePath, PATHINFO_FILENAME);
        $fullUrl = generateFullUrl($imagePath);

        $folderData["designs"][] = [
            "source" => $fullUrl,
            "title" => $fileNameWithoutExt,
            "thumbnail" => $fullUrl,
            "parameters" => [
                "colors" => "#000000,#FFFFFF,#ECF0F1",
                "autoCenter" => true,
                "left" => 0,
                "top" => 0,
                "z" => -1,
                "replaceInAllViews" => false,
                "draggable" => true,
                "rotatable" => true,
                "resizable" => true,
                "zChangeable" => true,
                "autoSelect" => false,
                "topped" => false,
                "uniScalingUnlockable" => false,
                "copyable" => false,
                "boundingBoxMode" => "clipping",
                "scaleMode" => "fit",
                "price" => 0,
                "minScaleLimit" => 0.01,
                "removable" => true
            ]
        ];
    }

    // Her klasörün verisini genel JSON verisine ekle
    $allData[] = $folderData;
}

// Genel JSON dosyasını /designs klasörüne kaydetme
$jsonFilePath = $basePath . '/designs.json';
file_put_contents($jsonFilePath, json_encode($allData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

// Görsellerin tam URL'sini oluşturmak için yardımcı fonksiyon
function generateFullUrl($filePath) {
    $baseUrl = 'https://kendintasarla.wolfdizayn.com/wolfdizayn/designer/data/designs'; // Temel URL
    $relativePath = str_replace(__DIR__ . '/data/designs', '', $filePath); // Çoklanan yol sorununu düzeltiyoruz
    return rtrim($baseUrl, '/') . '/' . ltrim($relativePath, '/'); // URL formatını düzenliyoruz
}

?>
