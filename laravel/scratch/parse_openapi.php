<?php
$json = file_get_contents(__DIR__ . '/../FivGo.openapi.json');
$data = json_decode($json, true);

$paths = array_keys($data['paths']);
$tags = [];
foreach ($data['paths'] as $path => $methods) {
    foreach ($methods as $method => $details) {
        if (isset($details['tags'])) {
            foreach ($details['tags'] as $tag) {
                $tags[$tag][] = "$method $path";
            }
        }
    }
}

echo "Tags and Endpoints:\n";
foreach ($tags as $tag => $endpoints) {
    echo "- $tag (" . count($endpoints) . " endpoints)\n";
}

if (isset($data['components']['schemas'])) {
    echo "\nSchemas:\n";
    foreach (array_keys($data['components']['schemas']) as $schema) {
        echo "- $schema\n";
    }
}
