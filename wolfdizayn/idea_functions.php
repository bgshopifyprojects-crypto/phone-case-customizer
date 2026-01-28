<?php

function fetchData($access_token, $endpoint, $callback_function = null, $params = array()) {
	$page = 1;
	$limit = 100;
	$data = array();

	// Ek parametreleri query string'e dönüştürme
	$queryString = http_build_query($params);

	do {
		// Eğer queryString varsa, URL'ye ekle
		$url = ROOT_URL . "admin-api/$endpoint?limit=$limit&page=$page";
		if (!empty($queryString)) {
			$url .= '&' . $queryString;
		}

		$request = array(
			'url' => $url,
			'method' => 'GET',
			'body' => '',
			'headers' => array(
				"Accept: application/json",
				"Authorization: Bearer $access_token"
			)
		);

		$response = curl_request($request);

		if ($response['status'] != 200) {
			echo "HTTP Hatası: " . $response['status'];
			return false;
		}

		$new_data = json_decode($response['body'], true);

		if (!isset($new_data) || !is_array($new_data)) {
			break;
		}

		if ($callback_function === null) {
			$data = array_merge($data, $new_data);
		}

		if ($callback_function !== null) {
			call_user_func($callback_function, $new_data);
		}

		$page++;

	} while (count($new_data) > 0);

	if ($callback_function === null) {
		return $data;
	}

	return true;
}

function fetchOldData($access_token, $endpoint, $callback_function = null) {
	$page = 1;
	$limit = 100;
	$data = array();
	$startUpdatedAt = date("Y-m-d H:i:s", strtotime("-2 day"));

	do {
		$url = ROOT_URL . "api/$endpoint?limit=$limit&page=$page";

		$url .= "&startUpdatedAt=" . urlencode($startUpdatedAt);

		$request = array(
			'url' => $url,
			'method' => 'GET',
			'body' => '',
			'headers' => array(
				"Accept: application/json",
				"Authorization: Bearer $access_token"
			)
		);

		$response = curl_request($request); 

		if ($response['status'] != 200) {
			echo "HTTP Hatası: " . $response['status'];
			return false; 
		}

		$new_data = json_decode($response['body'], true); 

		if (!isset($new_data) || !is_array($new_data)) {
			break; 
		}

		if ($callback_function === null) {
			$data = array_merge($data, $new_data);
			print_r($data);
		}

		if ($callback_function !== null) {
			call_user_func($callback_function, $new_data);
		}

		$page++;

	} while (count($new_data) > 0); 

	if ($callback_function === null) {
		return $data;
	}

	return true; 
}

function saveOrderDataToDatabase($orderData) {
    $conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);

    if ($conn->connect_error) {
        return;
    }

    $conn->set_charset("utf8mb4");

    if (empty($orderData['orderItems'])) {
        return;
    }

    // Gift Note ayrıştırma işlemi
    $giftNote = $orderData['giftNote'];
    $deliveryDate = $deliveryTime = $pickupDate = $pickupTime = null;

    if ($giftNote) {
        preg_match('/Teslim Tarihi:\s*(\d{4}-\d{2}-\d{2})/', $giftNote, $deliveryDateMatch);
        preg_match('/Teslim Saati:\s*([\d:]+ - [\d:]+)/', $giftNote, $deliveryTimeMatch);
        preg_match('/Alım Tarihi:\s*(\d{4}-\d{2}-\d{2})/', $giftNote, $pickupDateMatch);
        preg_match('/Alım Saati:\s*([\d:]+ - [\d:]+)/', $giftNote, $pickupTimeMatch);

        $deliveryDate = $deliveryDateMatch[1] ?? null;
        $deliveryTime = $deliveryTimeMatch[1] ?? null;
        $pickupDate = $pickupDateMatch[1] ?? null;
        $pickupTime = $pickupTimeMatch[1] ?? null;
    }

    foreach ($orderData['orderItems'] as $orderItem) {
        $orderId = $orderData['id'];
        $orderStatus = $orderData['status'];
        $fullname = $orderData['customerFirstname'] . ' ' . $orderData['customerSurname'];
        $email = $orderData['customerEmail'];
        $created_at = $orderData['createdAt'];
        $quantity = $orderItem['productQuantity'];
        $orderItemId = $orderItem['id'];
        $productName = $orderItem['productName'];
        $productId = $orderItem['product']['id'];

        $address = $orderData['shippingAddress']['firstname'] . ' ' .
            $orderData['shippingAddress']['surname'] . ', ' .
            $orderData['shippingAddress']['address'] . ', ' .
            $orderData['shippingAddress']['subLocation'] . ', ' .
            $orderData['shippingAddress']['location'] . ', ' .
            $orderData['shippingAddress']['country'] . '<br>' .
            $orderData['shippingAddress']['mobilePhoneNumber'] . ', ' .
            $orderData['shippingAddress']['phoneNumber'];

        $checkOrderItemSql = "SELECT * FROM order_items WHERE order_item_id = ?";
        $stmt = $conn->prepare($checkOrderItemSql);
        $stmt->bind_param("s", $orderItemId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            // Yeni kayıt ekleme
            $insertSql = "INSERT INTO order_items (order_id, fullname, email, order_item_id, product_id, product_name, created_at, order_status, address, quantity, delivery_date, delivery_time, pickup_date, pickup_time)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($insertSql);
            $stmt->bind_param('isssssssssssss', $orderId, $fullname, $email, $orderItemId, $productId, $productName, $created_at, $orderStatus, $address, $quantity, $deliveryDate, $deliveryTime, $pickupDate, $pickupTime);
            $stmt->execute();
            $stmt->close();
        } else {
            // Mevcut kaydı güncelleme
            $updateSql = "UPDATE order_items SET order_status=?, product_name=?, created_at=?, address=?, quantity=?, delivery_date=?, delivery_time=?, pickup_date=?, pickup_time=? WHERE order_item_id=?";
            $stmt = $conn->prepare($updateSql);
            $stmt->bind_param('ssssssssss', $orderStatus, $productName, $created_at, $address, $quantity, $deliveryDate, $deliveryTime, $pickupDate, $pickupTime, $orderItemId);
            $stmt->execute();
            $stmt->close();
        }
    }

    $conn->close();
}

?>
