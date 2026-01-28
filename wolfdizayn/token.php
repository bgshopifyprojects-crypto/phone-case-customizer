<?php

require_once 'config.php';
require_once 'functions.php';


if (isset($_GET['error'])) {
	echo 'Hata: ' . $_GET['error_description'] . PHP_EOL;
	exit;
}

$conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);

if ($conn->connect_error) {
	die("Veritabanı bağlantısı başarısız: " . $conn->connect_error);
}

$sql = "SHOW TABLES LIKE 'ideasoft'";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
	$sql = "SELECT refresh_token FROM ideasoft WHERE id = 1";
	$result = $conn->query($sql);
} else {
	create_tokens_table();
	$sql = "SELECT refresh_token FROM ideasoft WHERE id = 1";
	$result = $conn->query($sql);
}

if ($result->num_rows > 0) {
	$row = $result->fetch_assoc();
	$refresh_token = $row['refresh_token'];

	if (!empty($refresh_token) && $refresh_token !== null) {
		$request = create_token_request_by_refresh_token($refresh_token);
		$response = curl_request($request);
		$token_data = json_decode($response['body'], true);
		if (isset($token_data['error'])) {
			echo 'Hata: ' . $token_data['error_description'] . PHP_EOL;
			exit;
		}

		$access_token = $token_data['access_token'];
		$refresh_token = $token_data['refresh_token'];

		save_tokens_to_database($access_token, $refresh_token);

		echo 'Access TOKEN güncellendi';
		echo 'Refresh TOKEN güncellendi';

		exit;
	}
}
$conn->close();

if (isset($_GET['code'])) {
	$code = $_GET['code'];
	$request = create_token_request_by_code($code);
	$response = curl_request($request);
	$token_data = json_decode($response['body'], true);

	if (isset($token_data['error'])) {
		echo 'Hata: ' . $token_data['error_description'] . PHP_EOL;
		exit;
	}

	$access_token = $token_data['access_token'];
	$refresh_token = $token_data['refresh_token'];
	save_tokens_to_database($access_token, $refresh_token);

	echo 'Access Token güncellendi';
	echo 'Refresh Token güncellendi';
} else {
	$auth_url = AUTH_URL . '?client_id=' . urlencode(API_KEY) . '&response_type=code&state=' . urlencode($state) . '&redirect_uri=' . urlencode(REDIRECT_URI);
	header('Location: ' . $auth_url);
	exit;
}
?>
