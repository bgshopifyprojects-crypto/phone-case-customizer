<?php
// CORS ayarları
header("Access-Control-Allow-Origin: https://www.wolfdizayn.com");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// OPTIONS isteği kontrolü (CORS preflight için)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// POST isteği kontrolü
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    $isMain = isset($_GET['isMain']) && $_GET['isMain'] === 'true'; // isMain kontrolü

    if (!$id) {
        echo json_encode(["error" => "ID belirtilmedi."]);
        http_response_code(400);
        exit();
    }

    // uploads/{id} dizini
    $uploadDir = 'uploads/' . $id . '/';

    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            echo json_encode(["error" => "Klasör oluşturulamadı."]);
            http_response_code(500);
            exit();
        }
    }

    $uploadedResults = []; // Yüklenen dosyaların ve base64 görsellerin sonuçlarını tutmak için

	// images[] parametresini kontrol et (Dosya Yükleme)
	if (isset($_FILES['images']) && count($_FILES['images']['name']) > 0) {
		$uploadedFiles = $_FILES['images'];

		foreach ($uploadedFiles['name'] as $index => $fileName) {
			$fileTmpName = $uploadedFiles['tmp_name'][$index];
			$fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);

			// Dosya adı belirleme
			if ($isMain) {
				switch ($index) {
					case 0:
						$uniqueFileName = "main." . $fileExtension;
						break;
					case 1:
						$uniqueFileName = "image1." . $fileExtension;
						break;
					case 2:
						$uniqueFileName = "print-image." . $fileExtension;
						break;
					default:
						$uniqueFileName = md5(uniqid(rand(), true)) . "." . $fileExtension;
						break;
				}
			} else {
				$uniqueFileName = md5(uniqid(rand(), true)) . "." . $fileExtension;
			}

			$uploadFilePath = $uploadDir . $uniqueFileName;

			if (move_uploaded_file($fileTmpName, $uploadFilePath)) {
				$uploadedResults[] = [
					"image_src" => "https://kendintasarla.wolfdizayn.com/wolfdizayn/designer/uploads/" . $id . "/" . $uniqueFileName,
					"filename" => pathinfo($uniqueFileName, PATHINFO_FILENAME),
					"warning" => null
				];
			} else {
				$uploadedResults[] = [
					"image_src" => null,
					"filename" => $fileName,
					"warning" => "Dosya yüklenirken hata oluştu."
				];
			}
		}
	}

	// base64Images[] parametresini kontrol et (Base64 Görsel Yükleme)
	if (isset($_POST['url']) && is_string($_POST['url'])) {
		$base64Image = $_POST['url'];

		if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
			$data = substr($base64Image, strpos($base64Image, ',') + 1);
			$type = strtolower($type[1]); // Görsel tipi (jpg, png, vb.)

			if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
				echo json_encode([
					"image_src" => null,
					"filename" => "base64_image",
					"warning" => "Geçersiz görsel formatı: $type"
				]);
				exit();
			}

			$data = base64_decode($data);

			if ($data === false) {
				echo json_encode([
					"image_src" => null,
					"filename" => "base64_image",
					"warning" => "Base64 decode hatası"
				]);
				exit();
			}

			// Dosya adı belirleme
			$uniqueFileName = $isMain ? "main.{$type}" : md5(uniqid(rand(), true)) . ".{$type}";
			$uploadFilePath = $uploadDir . $uniqueFileName;

			if (file_put_contents($uploadFilePath, $data)) {
				echo json_encode([
					"image_src" => "https://kendintasarla.wolfdizayn.com/wolfdizayn/designer/uploads/" . $id . "/" . $uniqueFileName,
					"filename" => pathinfo($uniqueFileName, PATHINFO_FILENAME),
					"warning" => null
				]);
				exit();
			} else {
				echo json_encode([
					"image_src" => null,
					"filename" => "base64_image",
					"warning" => "Base64 görsel kaydedilemedi."
				]);
				exit();
			}
		} else {
			echo json_encode([
				"image_src" => null,
				"filename" => "base64_image",
				"warning" => "Geçersiz base64 veri formatı"
			]);
			exit();
		}
	}


	// Sonuçları döndür
	if (empty($uploadedResults)) {
		echo json_encode(["error" => "Dosya veya base64 görsel gönderilmedi."]);
		http_response_code(400);
	} else {
		// Sadece ilk başarılı sonuç döndürülür
		foreach ($uploadedResults as $result) {
			if (!isset($result['error'])) {
				echo json_encode($result);
				exit;
			}
		}
		echo json_encode($uploadedResults[0]);
	}

} else {
    echo json_encode(["error" => "Lütfen POST isteği yapın."]);
    http_response_code(405);
}