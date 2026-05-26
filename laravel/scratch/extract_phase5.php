<?php
$json = file_get_contents(__DIR__ . '/../FivGo.openapi.json');
$data = json_decode($json, true);

$endpoints = [];

foreach ($data['paths'] as $path => $methods) {
    foreach ($methods as $method => $details) {
        $tags = isset($details['tags']) ? implode(', ', $details['tags']) : 'No Tag';
        $endpoints[$tags][] = strtoupper($method) . ' ' . $path . ' - ' . ($details['summary'] ?? '');
    }
}

foreach ($endpoints as $tag => $eps) {
    if ($tag === 'Chat' || $tag === 'Notification' || $tag === 'Admin') {
        echo "$tag:\n" . implode("\n", $eps) . "\n\n";
    }
}
