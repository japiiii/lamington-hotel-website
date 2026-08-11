<?php
// Copy this file to db-config.php on the server and fill in real values.
// db-config.php is gitignored and must never be committed — it holds
// database credentials and the HQ API secret.

define('DB_HOST', 'localhost');
define('DB_NAME', 'REPLACE_WITH_DB_NAME');
define('DB_USER', 'REPLACE_WITH_DB_USER');
define('DB_PASS', 'REPLACE_WITH_DB_PASSWORD');

// Shared secret the lamington-system HQ poller must send back to
// authenticate against submissions-api.php.
define('API_SECRET', 'REPLACE_WITH_RANDOM_SECRET');
