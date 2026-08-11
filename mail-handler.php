<?php
header('Content-Type: application/json');

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
} else {
    fail(400, 'Unknown form.');
}

$headers = "From: Lamington Hotel Website <{$fromAddress}>\r\n"
    . "Reply-To: {$name} <{$email}>\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n";

if (mail($to, $subject, $body, $headers)) {
    echo json_encode(['success' => true]);
} else {
    fail(500, 'The message could not be sent. Please try again or email us directly.');
}
