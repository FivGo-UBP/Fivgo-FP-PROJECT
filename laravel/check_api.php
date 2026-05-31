<?php

// Diagnostic script to check Mapbox and TomTom Routing API status
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

$startLat = -6.175392;
$startLon = 106.827153;
$destLat = -6.195325;
$destLon = 106.782006;

echo "--- RUNNING GEOLOCATION API DIAGNOSTICS ---\n\n";

// 1. Test Mapbox Directions API
$mapboxToken = 'pk.eyJ1IjoiZml2Z28iLCJhIjoiY21wNHJhbjVrMDk4cjMyc2FmZTY3cjd6MiJ9.V3nFs9HLLnBEclngluui6A';
$mapboxUrl = "https://api.mapbox.com/directions/v5/mapbox/driving/{$startLon},{$startLat};{$destLon},{$destLat}?access_token={$mapboxToken}&geometries=geojson";

echo "Testing Mapbox Directions API...\n";
try {
    $response = Http::timeout(5)->get($mapboxUrl);
    echo "Mapbox HTTP Status: " . $response->status() . "\n";
    if ($response->successful()) {
        echo "Mapbox Connection: SUCCESS\n";
    } else {
        echo "Mapbox Connection: FAILED\n";
        echo "Mapbox Response: " . $response->body() . "\n";
    }
} catch (\Exception $e) {
    echo "Mapbox Exception: " . $e->getMessage() . "\n";
}

echo "\n-----------------------------------------\n\n";

// 2. Test TomTom Routing API
$tomtomKey = 'Uoy1BjIHY1Grg9HIUlti3lLs4v4dxebL';
$locations = "{$startLat},{$startLon}:{$destLat},{$destLon}";
$tomtomUrl = "https://api.tomtom.com/routing/1/calculateRoute/{$locations}/json?key={$tomtomKey}&travelMode=car";

echo "Testing TomTom Routing API...\n";
try {
    $response = Http::timeout(5)->get($tomtomUrl);
    echo "TomTom HTTP Status: " . $response->status() . "\n";
    if ($response->successful()) {
        echo "TomTom Connection: SUCCESS\n";
    } else {
        echo "TomTom Connection: FAILED\n";
        echo "TomTom Response: " . $response->body() . "\n";
    }
} catch (\Exception $e) {
    echo "TomTom Exception: " . $e->getMessage() . "\n";
}

echo "\n-----------------------------------------\n";
