<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class FormPengajuanController extends Controller
{
    /**
     * Handle form pengajuan dari Driver (ganti foto, ganti nomor, ganti kendaraan)
     */
    public function submit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'jenis_pengajuan' => 'required|in:foto,telepon,kendaraan,update,delete',
            'nama'            => 'required|string|max:100',
            'telepon'         => 'required|string|max:20',
            'catatan'         => 'nullable|string|max:1000',
            // foto profil
            'foto'            => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            // ganti telepon
            'telepon_lama'    => 'nullable|string|max:20',
            'telepon_baru'    => 'nullable|string|max:20',
            // ganti kendaraan
            'tipe_kendaraan'  => 'nullable|string|max:100',
            'plat_kendaraan'  => 'nullable|string|max:20',
            'stnk'            => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $jenis         = $request->input('jenis_pengajuan');
        $nama          = $request->input('nama');
        $telepon       = $request->input('telepon');
        $catatan       = $request->input('catatan', '-');
        $attachments   = [];

        // Handle file uploads directly to public/assets/pengajuan
        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $filename = time() . '_foto_' . $file->getClientOriginalName();
            $file->move(public_path('assets/pengajuan'), $filename);
            $fotoPath = 'assets/pengajuan/' . $filename;
            $attachments[] = ['path' => public_path($fotoPath), 'name' => $filename];
        }

        $stnkPath = null;
        if ($request->hasFile('stnk')) {
            $file = $request->file('stnk');
            $filename = time() . '_stnk_' . $file->getClientOriginalName();
            $file->move(public_path('assets/pengajuan'), $filename);
            $stnkPath = 'assets/pengajuan/' . $filename;
            $attachments[] = ['path' => public_path($stnkPath), 'name' => $filename];
        }

        // Cari user. Karena route public, cari dari user() (jika ada token) atau berdasarkan telepon
        $user = $request->user('api');
        if (!$user) {
            $teleponCari = $request->input('telepon_lama', $telepon);
            $user = \App\Models\User::where('phone', $teleponCari)->where('role', 'driver')->first();
        }

        if ($user) {
            $oldData = [];
            $newData = [];

            if ($jenis === 'foto') {
                $oldData['photo'] = $user->photo;
                $newData['photo'] = $fotoPath;
            } elseif ($jenis === 'telepon') {
                $oldData['telepon'] = $request->input('telepon_lama', $user->phone);
                $newData['telepon'] = $request->input('telepon_baru');
            } elseif ($jenis === 'kendaraan') {
                $profile = $user->driverProfile;
                $oldData['tipe_kendaraan'] = $profile ? $profile->vehicle_type : null;
                $oldData['plat_kendaraan'] = $profile ? $profile->plate_number : null;
                $newData['tipe_kendaraan'] = $request->input('tipe_kendaraan');
                $newData['plat_kendaraan'] = $request->input('plat_kendaraan');
                $newData['stnk'] = $stnkPath;
            } elseif ($jenis === 'delete' || $jenis === 'update') {
                $jenis = 'delete';
                $newData['reason'] = $request->input('alasan');
            }

            \App\Models\ProfileUpdateRequest::create([
                'user_id' => $user->id,
                'type' => $jenis,
                'old_data' => $oldData,
                'new_data' => $newData,
                'status' => 'pending',
                'notes' => $catatan,
            ]);
        }

        // Build email body
        $jenisLabel = match ($jenis) {
            'foto'      => 'Ganti Foto Profil',
            'telepon'   => 'Ganti Nomor Telepon',
            'kendaraan' => 'Ganti Kendaraan',
            'delete'    => 'Hapus Akun',
            default     => $jenis,
        };

        $detailHtml = $this->buildDetailHtml($jenis, $request, $nama, $telepon, $catatan);

        // Save to reports database (legacy fallback / tracking)
        $admin = \App\Models\User::where('role', 'admin')->first();
        $reportedId = $admin ? $admin->id : ($user ? $user->id : null);

        if ($user) {
            $desc = "Nama: " . $nama . "\nNomor Hp: " . $telepon;
            if ($jenis === 'telepon') {
                $desc .= "\nNomor Lama: " . $request->input('telepon_lama', '-') . "\nNomor Baru: " . $request->input('telepon_baru', '-');
            }
            if ($jenis === 'kendaraan') {
                $desc .= "\nKendaraan: " . $request->input('tipe_kendaraan', '-') . "\nPlat: " . $request->input('plat_kendaraan', '-');
            }
            $desc .= "\nCatatan: " . $catatan;

            \App\Models\Report::create([
                'type' => 'formulir',
                'reporter_id' => $user->id,
                'reported_id' => $reportedId,
                'reason' => 'Pengajuan: ' . $jenisLabel,
                'description' => $desc,
                'status' => 'open',
            ]);
        }

        // Kirim email
        try {
            Mail::html($detailHtml, function ($message) use ($jenisLabel, $attachments) {
                $message->to('fivgoubp@gmail.com')
                        ->subject("[FivGo Driver] Pengajuan: {$jenisLabel}");

                foreach ($attachments as $att) {
                    if (file_exists($att['path'])) {
                        $message->attach($att['path'], ['as' => $att['name']]);
                    }
                }
            });
        } catch (\Exception $e) {
            // Abaikan error email di lokal jika tidak terkonfigurasi
        }

        return response()->json([
            'message' => 'Pengajuan berhasil dikirim. Tim kami akan memproses dalam 1-3 hari kerja.',
        ], 200);
    }

    private function buildDetailHtml(string $jenis, Request $request, string $nama, string $telepon, string $catatan): string
    {
        $rows = "
            <tr><td style='padding:8px;font-weight:bold;color:#374151;'>Nama Lengkap</td><td style='padding:8px;'>$nama</td></tr>
            <tr><td style='padding:8px;font-weight:bold;color:#374151;'>Nomor Telepon</td><td style='padding:8px;'>$telepon</td></tr>
        ";

        if ($jenis === 'telepon') {
            $teleponLama = $request->input('telepon_lama', '-');
            $teleponBaru = $request->input('telepon_baru', '-');
            $rows .= "
                <tr><td style='padding:8px;font-weight:bold;color:#374151;'>Nomor Lama</td><td style='padding:8px;'>$teleponLama</td></tr>
                <tr><td style='padding:8px;font-weight:bold;color:#374151;'>Nomor Baru</td><td style='padding:8px;'>$teleponBaru</td></tr>
            ";
        }

        if ($jenis === 'kendaraan') {
            $tipe = $request->input('tipe_kendaraan', '-');
            $plat = $request->input('plat_kendaraan', '-');
            $rows .= "
                <tr><td style='padding:8px;font-weight:bold;color:#374151;'>Tipe/Merek Kendaraan</td><td style='padding:8px;'>$tipe</td></tr>
                <tr><td style='padding:8px;font-weight:bold;color:#374151;'>Plat Nomor</td><td style='padding:8px;'>$plat</td></tr>
            ";
        }

        $rows .= "<tr><td style='padding:8px;font-weight:bold;color:#374151;'>Catatan</td><td style='padding:8px;'>$catatan</td></tr>";

        $jenisLabel = match ($jenis) {
            'foto'      => 'Ganti Foto Profil',
            'telepon'   => 'Ganti Nomor Telepon',
            'kendaraan' => 'Ganti Kendaraan',
            default     => $jenis,
        };

        return "
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>
            <div style='background:linear-gradient(135deg,#1a3a8f,#2563eb);padding:24px;border-radius:8px 8px 0 0;'>
                <h2 style='color:#fff;margin:0;'>🚗 Pengajuan Driver — FivGo</h2>
                <p style='color:#bfdbfe;margin:8px 0 0;'>Jenis: <strong>{$jenisLabel}</strong></p>
            </div>
            <div style='background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;'>
                <table style='width:100%;border-collapse:collapse;background:#fff;border-radius:6px;overflow:hidden;border:1px solid #e5e7eb;'>
                    $rows
                </table>
                <p style='color:#6b7280;font-size:12px;margin-top:16px;'>
                    Email ini dikirim otomatis dari sistem FivGo. Waktu: " . now()->setTimezone('Asia/Jakarta')->format('d/m/Y H:i') . " WIB
                </p>
            </div>
        </div>
        ";
    }
}
