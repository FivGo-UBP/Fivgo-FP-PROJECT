<?php

namespace Tests\Unit;

use App\Services\DompetxService;
use PHPUnit\Framework\TestCase;

class DompetxServiceTest extends TestCase
{
    public function test_it_normalizes_legacy_payment_codes_to_dompetx_channel_codes(): void
    {
        $this->assertSame('qris', DompetxService::normalizeMethod('QRIS_VA'));
        $this->assertSame('qris', DompetxService::normalizeMethod('non tunai'));
        $this->assertSame('bca', DompetxService::normalizeMethod('VA_BCA'));
        $this->assertSame('bni', DompetxService::normalizeMethod('BNI'));
        $this->assertSame('mandiri', DompetxService::normalizeMethod('VA-MANDIRI'));
        $this->assertSame('tunai', DompetxService::normalizeMethod('cash'));
    }

    public function test_it_extracts_transaction_id_from_wrapped_gateway_payloads(): void
    {
        $this->assertSame('pay_123', DompetxService::extractTransactionId([
            'status' => 200,
            'data' => [
                'id' => 'pay_123',
                'status' => 'pending',
            ],
        ]));

        $this->assertSame('pay_456', DompetxService::extractTransactionId([
            'detail' => [
                'data' => [
                    'id' => 'pay_456',
                ],
            ],
        ]));
    }

    public function test_it_ignores_http_status_when_extracting_payment_status(): void
    {
        $this->assertSame('pending', DompetxService::extractStatus([
            'status' => 200,
            'data' => [
                'status' => 'PENDING',
            ],
        ]));

        $this->assertSame('paid', DompetxService::extractStatus([
            'detail' => [
                'data' => [
                    'status' => 'PAID',
                ],
            ],
        ]));
    }
}
