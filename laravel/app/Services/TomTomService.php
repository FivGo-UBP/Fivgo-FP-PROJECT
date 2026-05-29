<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class TomTomService
{
    protected Client $client;
    protected string $apiKey;

    public function __construct()
    {
        $this->client = new Client();
        $this->apiKey = env('TOMTOM_API_KEY', '');
    }

    /**
     * Snap koordinat mentah ke jalan terdekat menggunakan TomTom API.
     *
     * @param float $lat
     * @param float $lng
     * @return array
     */
    public function snapToRoad(float $lat, float $lng): array
    {
        if (empty($this->apiKey)) {
            Log::warning('TomTom API Key belum didefinisikan di file .env. Menggunakan koordinat asli.');
            return ['lat' => $lat, 'lng' => $lng, 'snapped' => false];
        }

        try {
            // TomTom Snap to Roads menerima format: points=longitude,latitude
            $response = $this->client->get('https://api.tomtom.com/routing/snapToRoads/1/snapToRoads', [
                'query' => [
                    'points' => "{$lng},{$lat}",
                    'key' => $this->apiKey,
                ],
                'timeout' => 3.0 // Timeout cepat agar tidak menunda update real-time
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (isset($data['snappedPoints'][0]['location'])) {
                $location = $data['snappedPoints'][0]['location'];
                return [
                    'lat' => (float) $location['latitude'],
                    'lng' => (float) $location['longitude'],
                    'snapped' => true
                ];
            }
        } catch (\Exception $e) {
            Log::error('TomTom Snap to Roads API Error: ' . $e->getMessage());
        }

        // Fallback jika API gagal / limit tercapai
        return ['lat' => $lat, 'lng' => $lng, 'snapped' => false];
    }

    /**
     * Hitung rute menggunakan TomTom Routing API.
     * Mengembalikan koordinat GeoJSON [[lng, lat], [lng, lat], ...]
     *
     * @param float $startLat
     * @param float $startLng
     * @param float $endLat
     * @param float $endLng
     * @param string $vehicleType
     * @return array
     */
    public function calculateRoute(float $startLat, float $startLng, float $endLat, float $endLng, string $vehicleType = 'motor'): array
    {
        if (empty($this->apiKey)) {
            Log::warning('TomTom API Key belum didefinisikan di file .env. Gagal menghitung rute.');
            return ['coordinates' => [], 'travel_time_seconds' => 0, 'distance_meters' => 0];
        }

        try {
            $locations = "{$startLat},{$startLng}:{$endLat},{$endLng}";
            $routeType = $vehicleType === 'motor' ? 'eco' : 'fastest';
            $travelMode = 'car'; // Pilihan mode terbaik di TomTom untuk rute ojek di Indonesia

            $query = [
                'key' => $this->apiKey,
                'routeType' => $routeType,
                'traffic' => 'true',
                'travelMode' => $travelMode,
            ];

            if ($vehicleType === 'motor') {
                $query['avoid'] = 'tollRoads';
            }

            $response = $this->client->get("https://api.tomtom.com/routing/1/calculateRoute/{$locations}/json", [
                'query' => $query,
                'timeout' => 5.0
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (isset($data['routes'][0]['legs'][0]['points'])) {
                $points = $data['routes'][0]['legs'][0]['points'];
                $summary = $data['routes'][0]['summary'] ?? [];
                
                // Konversi titik ke koordinat GeoJSON format [longitude, latitude]
                return [
                    'coordinates' => array_map(function ($point) {
                        return [(float) $point['longitude'], (float) $point['latitude']];
                    }, $points),
                    'travel_time_seconds' => $summary['travelTimeInSeconds'] ?? 0,
                    'distance_meters' => $summary['lengthInMeters'] ?? 0
                ];
            }
        } catch (\Exception $e) {
            Log::error('TomTom calculateRoute error: ' . $e->getMessage());
        }

        return ['coordinates' => [], 'travel_time_seconds' => 0, 'distance_meters' => 0];
    }
}
