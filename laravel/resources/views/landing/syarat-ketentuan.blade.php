<?php
$page_title       = "Syarat & Ketentuan – FivGo";
$page_description = "Baca syarat dan ketentuan penggunaan layanan FivGo, aplikasi ojek online terpercaya untuk perjalanan harian Anda.";
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0"/>
  <meta name="mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="theme-color" content="#1E3A8A"/>
  <title><?= $page_title ?></title>
  <meta name="description" content="<?= $page_description ?>"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="stylesheet" href="{{ asset('landing-assets/css/custom.css') }}"/>
  <style>
    .legal-hero { background: linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%); padding: 9rem 0 5rem; }
    .legal-body { max-width: 780px; margin: 0 auto; padding: 4rem 1.5rem; }
    .legal-body h2 { font-size: 1.25rem; font-weight: 700; color: #111827; margin: 2.5rem 0 0.75rem; }
    .legal-body p, .legal-body li { font-size: 0.95rem; color: #374151; line-height: 1.8; }
    .legal-body ul { padding-left: 1.5rem; margin: 0.5rem 0; }
    .legal-body li { margin-bottom: 0.4rem; }
    .legal-date { color: #6B7280; font-size: 0.82rem; margin-top: 0.5rem; }
    .back-link { display:inline-flex;align-items:center;gap:0.4rem;color:rgba(255,255,255,0.7);font-size:0.85rem;text-decoration:none;margin-bottom:1.5rem;transition:color 0.2s; }
    .back-link:hover { color:#fff; }
    .divider { border:none;border-top:1px solid #E5E7EB;margin:1.5rem 0; }
    @media (max-width:640px) {
      .legal-hero { padding:7rem 0 3rem; }
      .legal-body { padding:2.5rem 1rem; }
      .legal-body h2 { font-size:1.1rem; margin-top:2rem; }
      .legal-body p, .legal-body li { font-size:0.88rem; }
    }
    @media (max-width:480px) {
      .legal-hero { padding:6rem 0 2.5rem; }
      .legal-body { padding:2rem .85rem; }
      .legal-body h2 { font-size:1rem; }
      .legal-body p, .legal-body li { font-size:0.83rem; }
      .back-link { font-size:0.8rem; }
    }
    @media (max-width:360px) {
      .legal-hero { padding:5.5rem 0 2rem; }
      .legal-body { padding:1.5rem .75rem; }
    }
  </style>
</head>
<body>

@include('landing.partials.nav')

<!-- Hero -->
<div class="legal-hero">
  <div style="max-width:780px;margin:0 auto;padding:0 1.5rem;">
    <a href="{{ url('/') }}" class="back-link">← Kembali ke Beranda</a>
    <h1 style="color:#fff;font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;letter-spacing:-0.02em;">Syarat &amp; Ketentuan</h1>
    <p class="legal-date">Terakhir diperbarui: 16 Mei 2026</p>
  </div>
</div>

<!-- Body -->
<div class="legal-body">

  <h2>1. Definisi</h2>
  <ul>
    <li><strong>FIVGO</strong> adalah platform transportasi ojek online yang menghubungkan Customer dan Driver melalui aplikasi digital.</li>
    <li><strong>Customer</strong> adalah pengguna yang melakukan pemesanan layanan transportasi melalui aplikasi FIVGO.</li>
    <li><strong>Driver</strong> adalah mitra pengemudi yang menyediakan layanan transportasi melalui aplikasi FIVGO setelah melalui proses verifikasi dan persetujuan.</li>
    <li><strong>Admin</strong> adalah pihak yang mengelola operasional sistem melalui dashboard administrasi FIVGO.</li>
  </ul>

  <h2>2. Ketentuan Akun Pengguna</h2>
  <p>Untuk menggunakan layanan FIVGO, pengguna wajib:</p>
  <ul>
    <li>Memberikan data yang benar, lengkap, dan dapat dipertanggungjawabkan.</li>
    <li>Menjaga kerahasiaan akun dan kode OTP yang diterima.</li>
    <li>Tidak menggunakan akun milik pihak lain tanpa izin.</li>
    <li>Bertanggung jawab atas seluruh aktivitas yang dilakukan melalui akun masing-masing.</li>
  </ul>

  <h2>3. Registrasi dan Verifikasi Driver</h2>
  <p>Calon Driver wajib mengajukan pendaftaran melalui sistem FIVGO dan melengkapi data yang diminta. Pengajuan akan ditinjau oleh Admin sebelum akun dapat digunakan.</p>
  <p>Admin berhak melakukan verifikasi terhadap dokumen berikut:</p>
  <ul>
    <li>KTP</li>
    <li>SIM</li>
    <li>STNK</li>
    <li>SKCK</li>
    <li>Rekening Bank</li>
    <li>Bukti Pendaftaran Calon Driver</li>
  </ul>
  <p>Admin dapat menerima atau menolak pengajuan berdasarkan hasil verifikasi dokumen. Jika pengajuan ditolak, Admin dapat memberikan feedback atau alasan penolakan kepada calon Driver.</p>

  <h2>4. Izin Lokasi</h2>
  <p>Penggunaan layanan FIVGO mewajibkan izin lokasi perangkat aktif untuk mendukung proses pencarian Driver, pelacakan perjalanan, dan operasional layanan.</p>
  <p>Izin lokasi diperlukan baik pada aplikasi Customer maupun Driver.</p>

  <h2>5. Layanan yang Disediakan</h2>
  <p>FIVGO hanya menyediakan layanan transportasi ojek online.</p>
  <p>FIVGO tidak menyediakan layanan pengantaran makanan maupun pengiriman barang dalam ruang lingkup sistem yang dikembangkan saat ini.</p>

  <h2>6. Pemesanan dan Perjalanan</h2>
  <ul>
    <li>Customer dapat memilih layanan kendaraan yang tersedia.</li>
    <li>Sistem akan mencarikan Driver terdekat.</li>
    <li>Status perjalanan terdiri dari:
      <ul>
        <li>Pending</li>
        <li>Accepted</li>
        <li>On-going</li>
        <li>Completed</li>
        <li>Cancelled</li>
      </ul>
    </li>
    <li>Customer dapat memantau posisi Driver secara real-time selama perjalanan berlangsung.</li>
  </ul>

  <h2>7. Pembayaran</h2>
  <p>FIVGO mendukung metode pembayaran:</p>
  <ul>
    <li>Tunai (Cash)</li>
    <li>Non-Tunai melalui Dana atau metode pembayaran yang terintegrasi dengan Dompet X</li>
  </ul>
  <p>Pembayaran non-tunai akan diproses oleh sistem setelah perjalanan selesai sesuai tarif yang berlaku.</p>

  <h2>8. Rating dan Ulasan</h2>
  <p>Setelah perjalanan selesai, Customer dapat memberikan:</p>
  <ul>
    <li>Rating bintang</li>
    <li>Ulasan (opsional)</li>
    <li>Laporan terhadap Driver</li>
  </ul>
  <p>Rating digunakan sebagai salah satu indikator evaluasi kualitas layanan Driver.</p>

  <h2>9. Pembatalan Pesanan</h2>
  <p>Customer maupun Driver dapat membatalkan pesanan sesuai ketentuan sistem.</p>
  <p>Sistem dapat menerapkan validasi tertentu berdasarkan status perjalanan, waktu pembatalan, atau kondisi operasional yang berlaku.</p>

  <h2>10. Penggunaan yang Dilarang</h2>
  <p>Pengguna dilarang:</p>
  <ul>
    <li>Memberikan informasi palsu saat registrasi.</li>
    <li>Menyalahgunakan aplikasi untuk tindakan yang melanggar hukum.</li>
    <li>Melakukan tindakan yang membahayakan pengguna lain.</li>
    <li>Mengganggu operasional sistem atau melakukan manipulasi data.</li>
    <li>Melakukan tindakan yang merugikan Customer, Driver, maupun FIVGO.</li>
  </ul>

  <h2>11. Hak Admin</h2>
  <p>Admin berhak:</p>
  <ul>
    <li>Mengaktifkan atau menonaktifkan akun Customer maupun Driver yang melanggar ketentuan.</li>
    <li>Meninjau laporan pengguna.</li>
    <li>Memverifikasi pendaftaran Driver.</li>
    <li>Mengelola promo, pesanan, dan operasional sistem.</li>
  </ul>

  <h2>12. Perubahan Ketentuan</h2>
  <p>FIVGO berhak mengubah Syarat &amp; Ketentuan sewaktu-waktu untuk menyesuaikan kebutuhan operasional dan pengembangan sistem.</p>
  <p>Perubahan akan berlaku setelah dipublikasikan pada aplikasi atau platform resmi FIVGO.</p>

  <h2>13. Kontak</h2>
  <p>Apabila terdapat pertanyaan, keluhan, atau laporan terkait layanan FIVGO, pengguna dapat menghubungi tim dukungan melalui fitur bantuan dan pesan yang tersedia pada aplikasi.</p>

  <hr class="divider"/>
  <p style="color:#9CA3AF;font-size:0.8rem;">&copy; 2026 FivGo. Seluruh hak cipta dilindungi undang-undang.</p>
</div>

@include('landing.partials.footer')

<div class="modal-overlay" id="downloadModal">
  <div class="modal-box">
    <div class="modal-icon" id="modalType">📥</div>
    <h3>Aplikasi <span id="modalTitle">Penumpang</span></h3>
    <p id="modalDescription">Terima kasih atas antusiasme Anda! Aplikasi FivGo sedang dipersiapkan. Nantikan kehadiran kami segera di Google Play Store.</p>
    <div style="background:#F9FAFB;border-radius:10px;padding:1rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.75rem;">
      <span style="font-size:1.5rem;">🚀</span>
      <div style="text-align:left;">
        <div style="font-size:0.8rem;font-weight:700;color:#111827;">Segera Rilis</div>
        <div style="font-size:0.75rem;color:#6B7280;">Nantikan peluncuran resmi kami di Google Play Store</div>
      </div>
    </div>
    <button class="btn-modal-close" onclick="closeModal()">Mengerti, Tutup</button>
  </div>
</div>

<script src="{{ asset('landing-assets/js/app.js') }}?v=3"></script>
</body>
</html>

