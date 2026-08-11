<?php
header('Content-Type: application/json');

require_once __DIR__ . '/db-config.php';

$to = 'reservations@lamingtonhotel.com.pg';
$fromAddress = 'website@lamingtonhotel.com.pg';

function clean_line($value) {
    return trim(preg_replace('/[\r\n]+/', ' ', (string) $value));
}

function fail($code, $message) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

function log_submission($fields, $mailSent) {
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $stmt = $pdo->prepare(
            'INSERT INTO submissions (form_type, name, email, room_type, check_in, check_out, guests, message, mail_sent)
             VALUES (:form_type, :name, :email, :room_type, :check_in, :check_out, :guests, :message, :mail_sent)'
        );
        $stmt->execute([
            ':form_type' => $fields['form_type'],
            ':name' => $fields['name'],
            ':email' => $fields['email'],
            ':room_type' => $fields['room_type'] ?? null,
            ':check_in' => $fields['check_in'] ?? null,
            ':check_out' => $fields['check_out'] ?? null,
            ':guests' => $fields['guests'] ?? null,
            ':message' => $fields['message'] ?? null,
            ':mail_sent' => $mailSent ? 1 : 0,
        ]);
    } catch (Throwable $e) {
        error_log('log_submission failed: ' . $e->getMessage());
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Method not allowed.');
}

$formType = clean_line($_POST['form_type'] ?? '');
$name = clean_line($_POST['name'] ?? '');
$email = clean_line($_POST['email'] ?? '');

if ($name === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(422, 'Please provide a valid name and email address.');
}

if ($formType === 'reservation') {
    $roomType = clean_line($_POST['roomType'] ?? '');
    $checkIn = clean_line($_POST['checkIn'] ?? '');
    $checkOut = clean_line($_POST['checkOut'] ?? '');
    $guests = clean_line($_POST['guests'] ?? '');

    if ($checkIn === '' || $checkOut === '') {
        fail(422, 'Please provide both check-in and check-out dates.');
    }

    $subject = 'Booking request - ' . $name;
    $body = "New booking request from the website:\n\n"
        . "Name: {$name}\n"
        . "Email: {$email}\n"
        . "Room type: {$roomType}\n"
        . "Check in: {$checkIn}\n"
        . "Check out: {$checkOut}\n"
        . "Guests: {$guests}\n";

    $logFields = [
        'form_type' => 'reservation',
        'name' => $name,
        'email' => $email,
        'room_type' => $roomType,
        'check_in' => $checkIn,
        'check_out' => $checkOut,
        'guests' => $guests,
    ];
} elseif ($formType === 'contact') {
    $message = trim((string) ($_POST['message'] ?? ''));

    if ($message === '') {
        fail(422, 'Please include a message.');
    }

    $subject = 'Website enquiry - ' . $name;
    $body = "New enquiry from the website:\n\n"
        . "Name: {$name}\n"
        . "Email: {$email}\n\n"
        . "Message:\n{$message}\n";

    $logFields = [
        'form_type' => 'contact',
        'name' => $name,
        'email' => $email,
        'message' => $message,
    ];
} else {
    fail(400, 'Unknown form.');
}

$headers = "From: Lamington Hotel Website <{$fromAddress}>\r\n"
    . "Reply-To: {$name} <{$email}>\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = mail($to, $subject, $body, $headers);

log_submission($logFields, $sent);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    fail(500, 'The message could not be sent. Please try again or email us directly.');
}
