<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('drivers:cleanup-stale', function () {
    $count = \App\Models\DriverProfile::where('status', 'online')
        ->where('updated_at', '<', now()->subMinutes(2))
        ->update(['status' => 'offline']);
    
    $this->info("Successfully set {$count} stale online drivers to offline.");
})->purpose('Clean up inactive online drivers who have closed their apps');
