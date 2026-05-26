<?php
$json = file_get_contents(__DIR__ . '/../FivGo.openapi.json');
$data = json_decode($json, true);

$entities = [];

foreach ($data['paths'] as $path => $methods) {
    foreach ($methods as $method => $details) {
        // Try to infer entity from response
        if (isset($details['responses']['200']['content']['application/json']['schema']['properties'])) {
            $props = $details['responses']['200']['content']['application/json']['schema']['properties'];
            // Look for things that look like models
            foreach ($props as $key => $val) {
                if ($key === 'user' || $key === 'customer' || $key === 'driver' || $key === 'order' || $key === 'admin' || $key === 'promo' || $key === 'vehicle' || $key === 'payment') {
                    if (isset($val['properties'])) {
                        if (!isset($entities[$key])) {
                            $entities[$key] = [];
                        }
                        foreach ($val['properties'] as $propKey => $propVal) {
                            $type = isset($propVal['type']) ? $propVal['type'] : 'unknown';
                            $entities[$key][$propKey] = $type;
                        }
                    }
                }
            }
        }
        
        // Also look at request bodies for creation/update
        if (isset($details['requestBody']['content']['application/json']['schema']['properties'])) {
            $props = $details['requestBody']['content']['application/json']['schema']['properties'];
            $parts = explode('/', trim($path, '/'));
            $potentialEntity = 'unknown';
            if (count($parts) > 0) {
                $potentialEntity = $parts[0]; // e.g. customer, driver, order
            }
            
            // if it's an update profile or create, add fields
            if (in_array($potentialEntity, ['customer', 'driver', 'order', 'admin', 'promo', 'payment']) && in_array($method, ['post', 'put', 'patch'])) {
                 if (!isset($entities[$potentialEntity])) {
                    $entities[$potentialEntity] = [];
                }
                foreach ($props as $propKey => $propVal) {
                    $type = isset($propVal['type']) ? $propVal['type'] : 'unknown';
                    if (!isset($entities[$potentialEntity][$propKey])) {
                        $entities[$potentialEntity][$propKey] = $type;
                    }
                }
            }
        }
    }
}

echo json_encode($entities, JSON_PRETTY_PRINT);
