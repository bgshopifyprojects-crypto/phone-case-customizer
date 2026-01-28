<?php

function create_token_request_by_code($code) {
	$timestamp = time();

	$data = array(
		'grant_type' => 'authorization_code',
		'client_id' => API_KEY,
		'client_secret' => API_SECRET,
		'code' => $code,
		'redirect_uri' => REDIRECT_URI,
	);

	return array(
		'url' => TOKEN_URL,
		'method' => 'POST',
		'headers' => array(
			'Content-Type: application/json',
		),
		'body' => json_encode($data),
	);
}

function create_token_request_by_refresh_token($refresh_token) {
	$data = array(
		'grant_type' => 'refresh_token',
		'client_id' => API_KEY,
		'client_secret' => API_SECRET,
		'refresh_token' => $refresh_token,
	);

	return array(
		'url' => TOKEN_URL,
		'method' => 'POST',
		'headers' => array(
			'Content-Type: application/json',
		),
		'body' => json_encode($data),
	);
}

function save_tokens_to_database($access_token, $refresh_token) {
	$conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);

	if ($conn->connect_error) {
		die("Veritabanı bağlantısı başarısız: " . $conn->connect_error);
	}

	$result = $conn->query("SHOW TABLES LIKE 'ideasoft'");
	if ($result->num_rows == 0) {
		create_tokens_table();
	}

	$sql = "INSERT INTO ideasoft (id, access_token, refresh_token) VALUES (1, '$access_token', '$refresh_token') ON DUPLICATE KEY UPDATE access_token = '$access_token', refresh_token = '$refresh_token'";

	if ($conn->query($sql) === TRUE) {
		echo "Tokenlar başarıyla kaydedildi veya güncellendi.";
	} else {
		echo "Hata: " . $sql . "<br>" . $conn->error;
	}

	$conn->close();
}

function create_tokens_table() {
	$conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);
	$sql = "CREATE TABLE IF NOT EXISTS ideasoft (
        id INT AUTO_INCREMENT PRIMARY KEY,
        access_token VARCHAR(255) NOT NULL,
        refresh_token VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";

	if ($conn->query($sql) === TRUE) {
		echo "Tablo başarıyla oluşturuldu veya zaten mevcut.";
	} else {
		echo "Hata: " . $sql . "<br>" . $conn->error;
	}
	$conn->close();
}

function curl_request($request) {
	$ch = curl_init();

	curl_setopt($ch, CURLOPT_URL, $request['url']);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $request['method']);
	curl_setopt($ch, CURLOPT_USERAGENT, 'DigitalFikirler');

	if (isset($request['body']) && !empty($request['body'])) {
		curl_setopt($ch, CURLOPT_POSTFIELDS, $request['body']);
	}
	curl_setopt($ch, CURLOPT_HTTPHEADER, $request['headers']);

	$response = curl_exec($ch);
	$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

	curl_close($ch);

	return array(
		'body' => $response,
		'status' => $http_status
	);
}

function getAccessToken() {
	$conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);
	if ($conn->connect_error) {
		die("Veritabanı bağlantısı başarısız: " . $conn->connect_error);
	}
	$sql = "SELECT access_token FROM ideasoft LIMIT 1";
	$result = $conn->query($sql);

	if ($result->num_rows > 0) {
		$row = $result->fetch_assoc();
		return $row['access_token'];
	} else {
		return null;
	}
	$conn->close();
}

function addIdeaProduct($data, $access_token) {

	$request = array(
		'url' => ROOT_URL . "admin-api/products",
		'method' => 'POST',
		'body' => json_encode($data),
		'headers' => array(
			"Accept: application/json",
			"Authorization: Bearer " . $access_token,
			"Content-Type: application/json"
		)
	);

	return curl_request($request);
}

function getIdeaProduct($product_id, $access_token) {
	$request = array(
		'url' => ROOT_URL . "admin-api/products/" . $product_id . "?includes=children&fields=id,children.id",
		'method' => 'GET',
		'headers' => array(
			"Accept: application/json",
			"Authorization: Bearer " . $access_token,
		)
	);

	return curl_request($request);
}

// Genel Update Product Function
function updateIdeaProduct($product_id, $update_data, $access_token) {
	$request = array(
		'url' => ROOT_URL . "admin-api/products/" . $product_id,
		'method' => 'PUT',
		'body' => json_encode($update_data),
		'headers' => array(
			"Accept: application/json",
			"Authorization: Bearer " . $access_token,
			"Content-Type: application/json"
		)
	);

	return curl_request($request);
}

function addProductImage($product_id, $image_data, $access_token) {
	$request = array(
		'url' => ROOT_URL . "admin-api/product_images",
		'method' => 'POST',
		'body' => json_encode(array(
			"filename" => $image_data['filename'],
			"extension" => $image_data['extension'],
			"sortOrder" => $image_data['sortOrder'],
			"attachment" => $image_data['attachment'],
			"product" => array("id" => $product_id)
		)),
		'headers' => array(
			"Accept: application/json",
			"Authorization: Bearer " . $access_token,
			"Content-Type: application/json"
		)
	);

	return curl_request($request);
}
function getAllOrdersFromDatabase() {
	// Veritabanı bağlantısını ayarlıyoruz
	$conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);
	if ($conn->connect_error) {
		die("Veritabanı bağlantısı başarısız: " . $conn->connect_error);
	}
	$conn->set_charset("utf8mb4");

	// Sipariş bilgilerini çekiyoruz
	$query = "SELECT order_id, fullname, email, delivery_date, delivery_time, pickup_date, pickup_time, order_status FROM order_items ORDER BY created_at DESC";
	$result = $conn->query($query);

	// Çekilen verileri kontrol ediyoruz
	if (!$result) {
		die("Sorgu hatası: " . $conn->error);
	}

	// Sonuçları bir diziye aktarıyoruz
	$orders = [];
	while ($row = $result->fetch_assoc()) {
		$orders[] = $row;
	}

	// Bağlantıyı kapatıyoruz ve sonuçları döndürüyoruz
	$conn->close();
	return $orders;
}
?>