<?php
$page_title = "FivGo – Perjalanan Harian Anda, Terpedomani dan Terpantau Nyata";
$page_desc  = "Aplikasi ojek online yang fokus membantu mobilitas harian Anda. Terhubung langsung dengan pengemudi terdekat, real-time tracking, dan keamanan OTP.";
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0"/>
  <meta name="mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
  <meta name="theme-color" content="#1E3A8A"/>
  <title><?= $page_title ?></title>
  <meta name="description" content="<?= $page_desc ?>"/>
  <meta property="og:title" content="<?= $page_title ?>"/>
  <meta property="og:description" content="<?= $page_desc ?>"/>
  <meta property="og:type" content="website"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="stylesheet" href="{{ asset('landing-assets/css/custom.css') }}"/>
  <link rel="icon" type="image/png" sizes="48x48" href="{{ asset('landing-assets/img/Logo_FivGo.png') }}"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>

@include('landing.partials.nav')

<!-- ══════════════════════════════════
  HERO SECTION
══════════════════════════════════ -->
<section class="hero-section" id="beranda" style="padding-top: 120px;">
  <div class="hero-blob blob-1"></div>
  <div class="hero-blob blob-2"></div>

  <div class="hero-grid">
    <div class="hero-content">
     <h1 class="hero-title" style="animation:fadeInUp .65s .1s both; font-size:clamp(2.5rem,4vw,3.8rem); margin-bottom:1.25rem; line-height:1.2; text-align:left;">
  Perjalanan Harian Anda,<br>
  <span class="typed-inline-container">
    <span class="accent" id="typedText">Terpedomani</span><span style="color:var(--amber);">.</span>
  </span>
</h1>

      <p class="hero-sub" style="animation:fadeInUp .65s .2s both; font-size:1.05rem; max-width:540px; margin:0 0 2.5rem; color:var(--text-b); text-align:left;">
        FivGo hadir sebagai aplikasi ojek online yang fokus membantu mobilitas harian Anda secara terarah. Langsung terhubung dengan pengemudi aktif terdekat tanpa perantara yang rumit.
      </p>

     <div class="download-row" style="animation:fadeInUp .6s .3s both; justify-content:flex-start; margin-bottom:0;">
  
    <button class="btn-dl-badge">
      <img src="{{ asset('landing-assets/img/Logo_Playstore.png') }}" alt="Google Play" class="badge-icon">
      
      <div class="badge-text">
        <span class="text-top">UNDUH DI</span>
        <span class="text-bottom">Google Play</span>
      </div>
    </button>
  </a>

</div>
    </div>

    <!-- Mockup on the right -->
    <div class="hero-mockup-wrapper" style="animation:fadeInUp .8s .5s both;">
      <img src="{{ asset('landing-assets/img/Logo_Hp.png') }}" alt="Mockup Aplikasi FivGo"/>
    </div>
  </div>
</section>



<!-- ══════════════════════════════════
  FITUR UNGGULAN
══════════════════════════════════ -->
<section id="fitur" style="padding:5rem 0; background:#F3F4F6;">
  <div style="max-width:1200px;margin:0 auto;padding:0 1rem;">

    <div style="text-align:center;margin-bottom:3.5rem;" class="reveal">
      <span class="section-tag">[ Fitur Utama ]</span>
      <h2 class="section-title">
        Kenapa Memilih <span class="accent">FivGo?</span>
      </h2>
      <p class="section-sub" style="margin-top:.75rem;">
        Teknologi yang dirancang untuk memberikan pengalaman perjalanan yang aman, transparan, dan nyaman setiap harinya.
      </p>
    </div>

    <div class="feature-grid">

      <!-- Card 1 -->
      <div class="feature-card-wrapper reveal d1">
        <div class="feature-card">
          <div class="feature-card-header">
            <div class="feature-icon-wrap"><i class="fa-solid fa-map-location-dot" style="color: rgb(245, 158, 11);"></i></div>
            <h3>Pelacakan Lokasi Waktu Nyata</h3>
          </div>
          <hr class="feature-divider">
          <p>Sistem kami memanfaatkan titik koordinat lintang (latitude) dan bujur (longitude) secara presisi. Pantau pergerakan posisi pengemudi langsung di peta sejak pesanan diterima hingga tiba di tujuan.</p>
          <div>
            <span class="feature-tag" style="color:var(--blue-600);">GPS Presisi</span>
            <span class="feature-tag" style="color:var(--blue-600);">Live Map</span>
          </div>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="feature-card-wrapper reveal d2">
        <div class="feature-card">
          <div class="feature-card-header">
            <div class="feature-icon-wrap"><i class="fa-solid fa-lock" style="color: rgb(245, 158, 11);"></i></div>
            
            <h3>Gerbang Masuk Akun yang Aman</h3>
          </div>
          <hr class="feature-divider">
          <p>Kami menjaga privasi akun Anda melalui validasi ganda. Masuk menggunakan Akun Google atau Nomor HP yang divalidasi dengan kode OTP (berlaku 5 menit) guna mencegah akses dari pihak asing.</p>
          <div>
            <span class="feature-tag" style="color:var(--amber-h);">Google Auth</span>
            <span class="feature-tag" style="color:var(--amber-h);">OTP 5 Menit</span>
          </div>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="feature-card-wrapper reveal d3">
        <div class="feature-card">
          <div class="feature-card-header">
            <div class="feature-icon-wrap"><i class="fa-solid fa-clipboard-list" style="color: rgb(245, 158, 11);"></i></div>
            <h3>Pencatatan Riwayat Perjalanan Digital</h3>
          </div>
          <hr class="feature-divider">
          <p>Semua aktivitas perjalanan Anda terekam rapi di sistem. Periksa detail perjalanan terdahulu, pantau status orderan lalu, dan lakukan pencarian berdasarkan tanggal secara transparan.</p>
          <div>
            <span class="feature-tag" style="color:#16A34A;">Riwayat Lengkap</span>
            <span class="feature-tag" style="color:#16A34A;">Cari per Tanggal</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ══════════════════════════════════
  CARA KERJA
══════════════════════════════════ -->
<section id="cara-kerja" class="how-section" style="padding:5rem 0;">
  <div style="max-width:1200px;margin:0 auto;padding:0 1rem;">
    <div class="grid-how">

     <div class="reveal-left sticky-header">
  <span class="section-tag" style="color:#111827;">[ Cara Kerja ]</span>
  <h2 class="section-title" style="margin-bottom:1rem;">
    Tiga Langkah Mudah<br>Mulai <span class="accent">Perjalanan</span>
  </h2>
  <p style="color:var(--text-m);font-size:.95rem;line-height:1.75;margin-bottom:2rem;">
    Dari unduh hingga tiba di tujuan, FivGo dirancang sesederhana dan setransparan mungkin untuk kenyamanan Anda.
  </p>
  
  <button class="btn-dl-badge btn-yellow" onclick="openModal('passenger')">
  
  <div class="badge-text">
    <span class="text-top" style="color: #4A3700;"></span> <span class="text-bottom" style="color: #111827;">Mulai Perjalanan</span> </div>
</button>
</div>

      <!-- Right Steps -->
      <div style="display:flex;flex-direction:column;gap:2.5rem;">

        <div class="step-card reveal d1">
          <div style="position:relative;">
            <div class="step-num">1</div>
            <div class="step-line"></div>
          </div>
          <div class="step-content">
            <h3>Unduh Aplikasi &amp; Masuk Akun</h3>
            <p>Unduh aplikasi FivGo Penumpang, lalu masuk dengan mudah menggunakan metode Google atau nomor HP resmi Anda.</p>
            <div class="step-warning">
              <span>⚠️</span>
              <span><strong>Catatan:</strong> Aplikasi mewajibkan izin lokasi perangkat Anda selalu aktif (foreground &amp; background) agar sistem dapat mencarikan pengemudi dengan akurat.</span>
            </div>
          </div>
        </div>

        <div class="step-card reveal d2">
          <div style="position:relative;">
            <div class="step-num">2</div>
            <div class="step-line"></div>
          </div>
          <div class="step-content">
            <h3>Tentukan Tujuan &amp; Cari Pengemudi</h3>
            <p>Masukkan titik penjemputan dan tujuan perjalanan. Sistem mendeteksi koordinat lokasi Anda otomatis dan mencarikan mitra pengemudi terdekat yang sedang aktif.</p>
          </div>
        </div>

        <div class="step-card reveal d3">
          <div>
            <div class="step-num">3</div>
          </div>
          <div class="step-content">
            <h3>Selamat Sampai &amp; Beri Evaluasi</h3>
            <p>Nikmati perjalanan yang terpantau aman di peta. Setelah tiba, berikan rating nyata sebagai umpan balik langsung untuk menjaga kualitas layanan FivGo.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ══════════════════════════════════
  DRIVER CTA BANNER
══════════════════════════════════ -->
<section id="gabung-mitra" class="driver-section" style="padding:5rem 0;">
  <div style="max-width:1200px;margin:0 auto;padding:0 1rem;position:relative;z-index:1;">
    <div class="grid-driver">

      <!-- Left: Image -->
      <div class="reveal-left" style="display:flex;justify-content:center;">
        <img src="{{ asset('landing-assets/img/Logo_banner.png') }}" alt="Mitra Driver FivGo" class="driver-img"/>
      </div>

      <!-- Right: Content -->
      <div class="reveal-right">
        <span class="section-tag" style="color:#111827;">[ Gabung Mitra ]</span>
        <h2 style="font-size:clamp(1.5rem,3.2vw,2.2rem);font-weight:800;color:var(--text-h);line-height:1.3;letter-spacing:-.02em;margin-bottom:1rem;">
          Mau Dapat Penghasilan Tambahan?<br>
          <span style="color:var(--amber);font-style:italic;">Yuk, Jadi Driver FivGo!</span>
        </h2>
        <p style="color:var(--text-b);font-size:.95rem;line-height:1.75;margin-bottom:2.5rem;">
  Daftarnya praktis langsung dari HP kamu! Cukup unduh aplikasi FivGo Driver, lengkapi data profil beserta OTP, lalu tinggal pantau status akunmu  apakah sedang <strong style="color:var(--text-h);">ditinjau, diterima, atau ditolak.</strong>
</p>
        <div class="benefit-badges">
          <span class="benefit-badge">✓ Registrasi Mitra</span>
          <span class="benefit-badge">✓ Pelacakan Real-Time</span>
          <span class="benefit-badge">✓ Transparansi Saldo</span>
        </div>
        <button class="btn-driver-dark" onclick="openModal('driver')">
          Daftar Menjadi Driver
        </button>
      </div>
    </div>
  </div>
</section>

@include('landing.partials.footer')

<!-- MODAL -->
<div class="modal-overlay" id="downloadModal">
  <div class="modal-box">
    <div class="modal-icon" id="modalType">📥</div>
    <h3>Aplikasi <span id="modalTitle">Penumpang</span></h3>
    <p id="modalDescription">Terima kasih atas antusiasme Anda! Aplikasi FivGo sedang dipersiapkan. Nantikan kehadiran kami segera di Google Play Store.</p>
    <div style="background:var(--soft);border-radius:12px;padding:1rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:.75rem;border:1px solid var(--border);">
      <span style="font-size:1.5rem;"><i class="fa-solid fa-rocket" style="color: rgb(245, 158, 11);"></i></span>
      <div style="text-align:left;">
        <div style="font-size:.8rem;font-weight:700;color:var(--text-h);">Segera Rilis</div>
        <div style="font-size:.75rem;color:var(--text-m);">Nantikan peluncuran resmi kami di Google Play Store</div>
      </div>
    </div>
    <button class="btn-modal-close" onclick="closeModal()">Mengerti, Tutup</button>
  </div>
</div>

<script src="{{ asset('landing-assets/js/app.js') }}?v=3"></script>
</body>
</html>

