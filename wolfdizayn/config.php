<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Content-Type: text/html; charset=utf-8');

define('DB_HOST', 'localhost');
define('DB_USERNAME', 'wolfdizayn');
define('DB_PASSWORD', 'wolfdizayn1357*');
define('DB_NAME', 'wolfdizayn');

define('API_KEY', '1ijh696g1zxcgcsko08co4800gwgwcksg008sooswog888gwgg');
define('API_SECRET', '61aurjny50kk00o48w0ogcw0woco4wwkkww48gg0gcg4coksg0');
define('ROOT_URL', 'https://metinorkmez.myideasoft.com/');
define('API_URL', ROOT_URL . 'oauth/v2/');
define('TOKEN_URL', API_URL . 'token');
define('AUTH_URL', ROOT_URL . 'panel/auth/');
define('REDIRECT_URI', 'https://kendintasarla.wolfdizayn.com/wolfdizayn/token.php');
$state = "123456Aa";

?>