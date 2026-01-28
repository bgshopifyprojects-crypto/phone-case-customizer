<?php
header("Access-Control-Allow-Origin: https://www.wolfdizayn.com");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

function createZipUsingShell($folderPath, $zipFilePath) {
    if (!is_dir($folderPath)) {
        echo json_encode(["success" => false, "message" => "Hata: Klasör bulunamadı: $folderPath"]);
        exit;
    }

    $folderPath = realpath($folderPath);
    $zipFilePath = realpath(dirname($folderPath)) . '/' . basename($zipFilePath);

    $parentDir = dirname($folderPath);
    $folderName = basename($folderPath);

    $command = "cd " . escapeshellarg($parentDir) . " && zip -r " . escapeshellarg($zipFilePath) . " " . escapeshellarg($folderName);

    shell_exec($command);

    if (!file_exists($zipFilePath)) {
        echo json_encode(["success" => false, "message" => "Hata: ZIP dosyası oluşturulamadı."]);
        exit;
    }

    return $zipFilePath;
}

$folderId = $_GET['folderId'] ?? '17349219636617144';
$baseFolder = __DIR__ . "/uploads/$folderId";
$zipFile = $baseFolder . ".zip";

$zipFilePath = createZipUsingShell($baseFolder, $zipFile);

$zipUrl = "https://kendintasarla.wolfdizayn.com/wolfdizayn/designer/uploads/$folderId.zip";
echo json_encode(["success" => true, "zipUrl" => $zipUrl]);
?>
