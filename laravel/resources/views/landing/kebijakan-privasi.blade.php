<?php
$page_title       = "Kebijakan Privasi – FivGo";
$page_description = "Pelajari bagaimana FivGo mengumpulkan, menggunakan, dan melindungi data pribadi Anda sebagai pengguna layanan ojek online kami.";
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
    .info-box { background:#DBEAFE;border-left:4px solid #1E3A8A;border-radius:0 8px 8px 0;padding:1rem 1.25rem;margin:1rem 0; }
    .info-box p { color:#1E3A8A;font-size:0.88rem;margin:0; }
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
    <h1 style="color:#fff;font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;letter-spacing:-0.02em;">Kebijakan Privasi</h1>
    <p class="legal-date">Terakhir diperbarui: 16 Mei 2026</p>
  </div>
</div>

<!-- Body -->
<div class="legal-body">
  <p>FIVGO menghargai dan melindungi informasi pengguna yang menggunakan layanan kami. Kebijakan Privasi ini menjelaskan bagaimana data pengguna dikumpulkan, digunakan, disimpan, dan dikelola dalam sistem FIVGO.</p>
  <p>Dengan menggunakan aplikasi FIVGO, Anda menyetujui pengumpulan dan penggunaan data sebagaimana dijelaskan dalam kebijakan ini.</p>

  <hr class="divider"/>

  <h2>1. Data yang Kami Kumpulkan</h2>
  <p>Untuk mendukung operasional layanan transportasi FIVGO, sistem dapat mengumpulkan data berikut:</p>
  
  <h3 style="font-size: 1.1rem; color: #111827; margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">Data Akun</h3>
  <ul>
    <li>Nama pengguna</li>
    <li>Nomor telepon</li>
    <li>Informasi registrasi akun</li>
    <li>Data profil pengguna</li>
  </ul>
  <p>Sistem menyediakan fitur registrasi dan login sesuai hak akses masing-masing pengguna.</p>

  <h3 style="font-size: 1.1rem; color: #111827; margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">Data Lokasi</h3>
  <p>Sistem menggunakan koordinat lokasi (latitude dan longitude) untuk:</p>
  <ul>
    <li>Menentukan lokasi penjemputan</li>
    <li>Menentukan lokasi tujuan</li>
    <li>Mencari Driver terdekat</li>
    <li>Menampilkan posisi Driver secara real-time</li>
    <li>Melakukan pelacakan perjalanan</li>
  </ul>

  <h3 style="font-size: 1.1rem; color: #111827; margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">Data Perjalanan</h3>
  <p>Sistem menyimpan informasi perjalanan yang meliputi:</p>
  <ul>
    <li>Titik penjemputan</li>
    <li>Titik tujuan</li>
    <li>Status perjalanan</li>
    <li>Riwayat perjalanan</li>
    <li>Informasi transaksi perjalanan</li>
  </ul>

  <h3 style="font-size: 1.1rem; color: #111827; margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">Data Driver</h3>
  <p>Untuk proses verifikasi Driver, sistem dapat menyimpan:</p>
  <ul>
    <li>KTP</li>
    <li>SIM</li>
    <li>STNK</li>
    <li>Data rekening</li>
  </ul>

  <h2>2. Tujuan Penggunaan Data</h2>
  <p>Data yang dikumpulkan digunakan untuk:</p>
  <ul>
    <li>Membuat dan mengelola akun pengguna.</li>
    <li>Memproses pemesanan transportasi.</li>
    <li>Mencari dan mencocokkan Driver dengan Customer.</li>
    <li>Menampilkan lokasi dan perjalanan secara real-time.</li>
    <li>Mengelola status perjalanan.</li>
    <li>Memproses pembayaran.</li>
    <li>Menyimpan histori perjalanan.</li>
    <li>Mengirim notifikasi kepada Customer dan Driver.</li>
    <li>Membantu Admin melakukan monitoring operasional sistem.</li>
  </ul>

  <h2>3. Penggunaan Data Lokasi</h2>
  <p>FIVGO memerlukan akses lokasi perangkat untuk menjalankan layanan transportasi.</p>
  <p>Data lokasi digunakan untuk:</p>
  <ul>
    <li>Menampilkan posisi Customer dan Driver.</li>
    <li>Menentukan rute perjalanan.</li>
    <li>Menampilkan pelacakan perjalanan secara real-time.</li>
    <li>Mendukung proses pencarian Driver terdekat.</li>
  </ul>
  <p>Akurasi lokasi bergantung pada GPS dan layanan peta yang digunakan perangkat pengguna.</p>

  <h2>4. Penyimpanan dan Keamanan Data</h2>
  <p>FIVGO menerapkan berbagai mekanisme keamanan sistem, termasuk:</p>
  <ul>
    <li>Autentikasi berbasis token (JWT).</li>
    <li>Penyimpanan password dalam bentuk hash (bcrypt).</li>
    <li>Penggunaan protokol HTTPS untuk komunikasi data.</li>
    <li>Pembatasan akses berdasarkan peran pengguna.</li>
    <li>Pembatasan akses dashboard hanya untuk Admin yang terautentikasi.</li>
    <li>Validasi data untuk menjaga keamanan sistem.</li>
  </ul>

  <h2>5. Akses dan Pengelolaan Data</h2>
  <p>Data pengguna dapat diakses dan dikelola oleh pihak yang memiliki kewenangan sesuai fungsi sistem, yaitu:</p>
  <ul>
    <li>Customer</li>
    <li>Driver</li>
    <li>Admin</li>
  </ul>
  <p>Admin dapat melakukan monitoring data pengguna, data Driver, data pesanan, dan aktivitas perjalanan melalui dashboard administrasi.</p>

  <h2>6. Pembagian Data</h2>
  <p>Untuk mendukung operasional layanan:</p>
  <ul>
    <li>Informasi perjalanan dapat ditampilkan kepada Customer dan Driver yang terlibat dalam pesanan yang sama.</li>
    <li>Data lokasi digunakan untuk kebutuhan pelacakan perjalanan dan pencocokan Driver.</li>
    <li>Data dapat diproses oleh sistem backend FIVGO untuk menjalankan layanan aplikasi.</li>
  </ul>
  <p>Dokumen spesifikasi tidak menjelaskan adanya penjualan data pengguna kepada pihak lain. Oleh karena itu penggunaan data dibatasi untuk kebutuhan operasional sistem FIVGO.</p>

  <h2>7. Hak Pengguna</h2>
  <p>Pengguna memiliki hak untuk:</p>
  <ul>
    <li>Mengakses akun yang dimiliki.</li>
    <li>Mengubah informasi profil yang tersedia.</li>
    <li>Melihat histori perjalanan.</li>
    <li>Menggunakan fitur bantuan dan pelaporan yang tersedia dalam aplikasi.</li>
  </ul>

  <h2>8. Perubahan Kebijakan Privasi</h2>
  <p>FIVGO dapat memperbarui Kebijakan Privasi ini sewaktu-waktu untuk menyesuaikan perkembangan sistem dan kebutuhan operasional.</p>
  <p>Perubahan akan diumumkan melalui aplikasi atau media resmi FIVGO.</p>

  <h2>9. Kontak dan Bantuan</h2>
  <p>Apabila Anda memiliki pertanyaan atau kendala terkait penggunaan data dan layanan FIVGO, silakan menggunakan fitur bantuan yang tersedia pada aplikasi.</p>
  <p>Sistem FIVGO menyediakan fitur bantuan dan pengelolaan laporan untuk membantu pengguna menyelesaikan permasalahan yang terjadi selama penggunaan layanan.</p>

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

