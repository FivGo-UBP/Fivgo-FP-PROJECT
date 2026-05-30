<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class DompetxService
{
    private string $apiKey;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = (string) config('services.dompetx.api_key');
        $this->baseUrl = rtrim((string) config('services.dompetx.base_url'), '/');
    }

    public function createPayment(array $payload, ?string $idempotencyKey = null): array
    {
        $response = $this->request('POST', '/v1/payments', $payload, $idempotencyKey);

        if (! empty($response['id'])) {
            try {
                $detail = $this->getPaymentDetail($response['id']);
                return array_replace_recursive($response, ['detail' => $detail]);
            } catch (RequestException) {
                return $response;
            }
        }

        return $response;
    }

    public function getPaymentDetail(string $transactionId): array
    {
        return $this->request('GET', "/v1/payments/detail/{$transactionId}");
    }

    public function checkStatus(string $transactionId): array
    {
        return $this->request('GET', "/v1/payments/check-status/{$transactionId}");
    }

    private function request(string $method, string $path, array $payload = [], ?string $idempotencyKey = null): array
    {
        if ($this->apiKey === '') {
            throw new RuntimeException('DompetX API key is not configured.');
        }

        $body = $method === 'GET'
            ? '{}'
            : json_encode($payload, JSON_UNESCAPED_SLASHES);

        $timestamp = (string) now()->timestamp;
        $signature = hash_hmac('sha256', "{$timestamp}.{$body}", $this->apiKey);

        $headers = [
            'Content-Type' => 'application/json',
            'X-DOMPAY-API-Key' => $this->apiKey,
            'X-DOMPAY-Signature' => $signature,
            'X-DOMPAY-Timestamp' => $timestamp,
        ];

        if ($idempotencyKey) {
            $headers['Idempotency-Key'] = $idempotencyKey;
        }

        $request = Http::timeout(20)
            ->acceptJson()
            ->withHeaders($headers);

        $url = "{$this->baseUrl}{$path}";

        $response = $method === 'GET'
            ? $request->get($url)
            : $request->withBody($body, 'application/json')->post($url);

        return $response->throw()->json() ?? [];
    }

    public static function normalizeMethod(string $method): string
    {
        $key = Str::upper(str_replace([' ', '-'], '_', trim($method)));

        return match ($key) {
            'QRIS_VA', 'NON_TUNAI', 'NONTUNAI', 'DOMPETX' => 'QRIS',
            'DANA' => 'DANA',
            'OVO' => 'OVO',
            'GOPAY', 'GO_PAY' => 'GOPAY',
            'SHOPEEPAY', 'SHOPEE_PAY' => 'SHOPEEPAY',
            'LINKAJA', 'LINK_AJA' => 'LINKAJA',
            'VA', 'VIRTUAL_ACCOUNT' => 'VA_BCA',
            'BCA' => 'VA_BCA',
            'BNI' => 'VA_BNI',
            'BRI' => 'VA_BRI',
            'MANDIRI' => 'VA_MANDIRI',
            'PERMATA' => 'VA_PERMATA',
            'CIMB' => 'VA_CIMB',
            'DANAMON' => 'VA_DANAMON',
            default => $key,
        };
    }
}
