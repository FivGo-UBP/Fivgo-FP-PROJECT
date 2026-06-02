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

Artisan::command('chats:purge-old', function () {
    $oldChats = \App\Models\Chat::where('created_at', '<', now()->subDays(7))->get();
    $count = 0;
    foreach ($oldChats as $chat) {
        if ($chat->image_url) {
            $parsedUrl = parse_url($chat->image_url);
            if (isset($parsedUrl['path'])) {
                $path = $parsedUrl['path'];
                $storagePos = strpos($path, '/storage/');
                if ($storagePos !== false) {
                    $relativePath = substr($path, $storagePos + strlen('/storage/'));
                    if (\Illuminate\Support\Facades\Storage::disk('public')->exists($relativePath)) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($relativePath);
                    }
                }
            }
        }
        $chat->delete();
        $count++;
    }
    $this->info("Successfully deleted {$count} chat messages older than 7 days.");
})->purpose('Purge chat messages older than 7 days');
