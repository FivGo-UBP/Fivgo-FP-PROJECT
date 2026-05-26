<?php
$json = file_get_contents(__DIR__ . '/../FivGo.openapi.json');
$data = json_decode($json, true);

$customerPaths = [];
$driverPaths = [];

foreach ($data['paths'] as $path => $methods) {
    if (strpos($path, '/customer/') === 0) {
        foreach ($methods as $method => $details) {
            $customerPaths[] = strtoupper($method) . ' ' . $path . ' - ' . $details['summary'];
        }
    }
    if (strpos($path, '/driver/') === 0) {
        foreach ($methods as $method => $details) {
            $driverPaths[] = strtoupper($method) . ' ' . $path . ' - ' . $details['summary'];
        }
    }
}

echo "Customer Endpoints:\n" . implode("\n", $customerPaths) . "\n\n";
echo "Driver Endpoints:\n" . implode("\n", $driverPaths) . "\n";
