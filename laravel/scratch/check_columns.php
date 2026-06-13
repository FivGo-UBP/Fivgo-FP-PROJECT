<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo "USERS COLUMNS:\n";
print_r(Schema::getColumnListing('users'));
echo "\nDRIVER PROFILES COLUMNS:\n";
print_r(Schema::getColumnListing('driver_profiles'));
