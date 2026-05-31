<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Arr;
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
        $transactionId = self::extractTransactionId($response);

        if ($transactionId) {
            try {
                $detail = $this->getPaymentDetail($transactionId);
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
            'TUNAI', 'CASH' => 'tunai',
            'QRIS', 'QRIS_VA', 'NON_TUNAI', 'NONTUNAI', 'DOMPETX' => 'qris',
            'DANA' => 'dana',
            'OVO' => 'ovo',
            'GOPAY', 'GO_PAY' => 'gopay',
            'SHOPEEPAY', 'SHOPEE_PAY' => 'shopeepay',
            'LINKAJA', 'LINK_AJA' => 'linkaja',
            'VA', 'VIRTUAL_ACCOUNT', 'VA_BCA', 'BCA' => 'bca',
            'VA_BNI', 'BNI' => 'bni',
            'VA_BRI', 'BRI' => 'bri',
            'VA_MANDIRI', 'MANDIRI' => 'mandiri',
            'VA_PERMATA', 'PERMATA' => 'permata',
            'VA_CIMB', 'CIMB' => 'cimb',
            'VA_DANAMON', 'DANAMON' => 'danamon',
            'VA_BSI', 'BSI' => 'bsi',
            default => $key,
        };
    }

    public static function extractTransactionId(array $payload): ?string
    {
        $value = self::firstPayloadValue($payload, [
            'id',
            'transaction_id',
            'data.id',
            'data.transaction_id',
            'payment.id',
            'payment.transaction_id',
            'transaction.id',
            'transaction.transaction_id',
            'detail.id',
            'detail.transaction_id',
            'detail.data.id',
            'detail.data.transaction_id',
            'detail.payment.id',
            'detail.payment.transaction_id',
        ]);

        return is_scalar($value) && (string) $value !== '' ? (string) $value : null;
    }

    public static function extractStatus(array $payload, ?string $default = null): ?string
    {
        $value = self::firstPayloadValue($payload, [
            'data.status',
            'payment.status',
            'transaction.status',
            'detail.data.status',
            'detail.payment.status',
            'detail.transaction.status',
            'detail.status',
            'status',
        ]);

        if (! is_scalar($value)) {
            return $default;
        }

        $status = strtolower(trim((string) $value));

        return $status !== '' && ! ctype_digit($status) ? $status : $default;
    }

    public static function firstPayloadValue(array $payload, array $paths, mixed $default = null): mixed
    {
        foreach ($paths as $path) {
            $value = Arr::get($payload, $path);

            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return $default;
    }
}
