<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class LaporanMasalahController extends Controller
{
    /**
     * Handle laporan masalah dari Customer
     */
    public function submit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama'      => 'required|string|max:100',
            'telepon'   => 'required|string|max:20',
            'kategori'  => 'required|string|max:100',
            'deskripsi' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $nama      = $request->input('nama');
        $telepon   = $request->input('telepon');
        $kategori  = $request->input('kategori');
        $deskripsi = $request->input('deskripsi');

        $htmlBody = "
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>
            <div style='background:linear-gradient(135deg,#f97316,#ea580c);padding:24px;border-radius:8px 8px 0 0;'>
                <h2 style='color:#fff;margin:0;'>🆘 Laporan Masalah Customer — FivGo</h2>
                <p style='color:#fed7aa;margin:8px 0 0;'>Kategori: <strong>$kategori</strong></p>
            </div>
            <div style='background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;'>
                <table style='width:100%;border-collapse:collapse;background:#fff;border-radius:6px;overflow:hidden;border:1px solid #e5e7eb;'>
                    <tr><td style='padding:8px;font-weight:bold;color:#374151;'>Nama Lengkap</td><td style='padding:8px;'>$nama</td></tr>
                    <tr><td style='padding:8px;font-weight:bold;color:#374151;'>Nomor Telepon</td><td style='padding:8px;'>$telepon</td></tr>
                    <tr><td style='padding:8px;font-weight:bold;color:#374151;'>Kategori Masalah</td><td style='padding:8px;'>$kategori</td></tr>
                    <tr>
                        <td style='padding:8px;font-weight:bold;color:#374151;vertical-align:top;'>Deskripsi Masalah</td>
                        <td style='padding:8px;'>$deskripsi</td>
                    </tr>
                </table>
                <p style='color:#6b7280;font-size:12px;margin-top:16px;'>
                    Email ini dikirim otomatis dari sistem FivGo. Waktu: " . now()->setTimezone('Asia/Jakarta')->format('d/m/Y H:i') . " WIB
                </p>
            </div>
        </div>
        ";

        // Deteksi role pelapor dari request (driver app mengirim reporter_role='driver')
        $reporterRoleHint = $request->input('reporter_role', 'customer');

        // Save to reports database
        // Cari user yang phone nya sama DAN role nya sesuai hint terlebih dahulu (menghindari bentrokan nomor hp kembar customer/driver)
        $reporter = \App\Models\User::where('phone', $telepon)
            ->where('role', $reporterRoleHint)
            ->first();

        if (!$reporter) {
            // Jika tidak ketemu dengan role hint tersebut, coba cari berdasarkan phone saja
            $reporter = \App\Models\User::where('phone', $telepon)->first();
        }

        if (!$reporter) {
            // Gunakan role hint dari request jika masih tidak ditemukan
            $reporter = \App\Models\User::where('role', $reporterRoleHint)->first();
        }
        
        $orderId = null;
        if (preg_match('/-\s*Order\s*ID:\s*([a-f\d\-]+)/i', $deskripsi, $matches)) {
            $orderId = trim($matches[1]);
        }

        $order = null;
        if ($orderId) {
            $order = \App\Models\Order::find($orderId);
        }

        $admin = \App\Models\User::where('role', 'admin')->first();
        
        $reporterId = $reporter ? $reporter->id : ($admin ? $admin->id : null);
        
        if ($order) {
            if ($reporter && $reporter->role === 'driver') {
                $reportedId = $order->customer_id ?: ($admin ? $admin->id : null);
            } else {
                $reportedId = $order->driver_id ?: ($admin ? $admin->id : null);
            }
        } else {
            $reportedId = $admin ? $admin->id : ($reporter ? $reporter->id : null);
        }

        if ($reporterId && $reportedId) {
            // Gunakan field `type` dari request jika ada, jika tidak fallback ke deteksi string lama
            if ($request->has('type') && in_array($request->input('type'), ['formulir', 'biasa'])) {
                $reportType = $request->input('type');
            } else {
                $reportType = str_contains($kategori, '(Formulir)') ? 'formulir' : 'biasa';
            }

            \App\Models\Report::create([
                'type' => $reportType,
                'reporter_id' => $reporterId,
                'reported_id' => $reportedId,
                'order_id' => $order ? $order->id : null,
                'reason' => $kategori,
                'description' => "Nama: " . $nama . "\nNomor Hp: " . $telepon . "\nDeskripsi: " . $deskripsi,
                'status' => 'open',
            ]);
        }

        Mail::html($htmlBody, function ($message) use ($kategori, $reporterRoleHint) {
            $roleLabel = $reporterRoleHint === 'driver' ? 'Driver' : 'Customer';
            $message->to('fivgoubp@gmail.com')
                    ->subject("[FivGo {$roleLabel}] Laporan Masalah: {$kategori}");
        });

        return response()->json([
            'message' => 'Laporan berhasil dikirim. Tim kami akan menindaklanjuti dalam 1-3 hari kerja.',
        ], 200);
    }
}
