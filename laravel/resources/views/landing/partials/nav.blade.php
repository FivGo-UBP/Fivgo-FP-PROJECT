<!-- Nav component -->
<nav id="navbar" class="custom-navbar">
  <div class="navbar-inner">

    <!-- Logo -->
    <a href="{{ url('/') }}" class="logo-wrap">
      <img src="{{ asset('landing-assets/img/Logo_FivGo.png') }}" alt="FivGo Logo"/>
      <span>FivGo</span>
    </a>

    <!-- Desktop Nav Center (pill) -->
    <div class="desktop-nav nav-pill-center">
      <a href="{{ url('/') }}#beranda"      class="nav-link active">Beranda</a>
      <a href="{{ url('/') }}#fitur"        class="nav-link">Fitur Utama</a>
      <a href="{{ url('/') }}#cara-kerja"   class="nav-link">Cara Kerja</a>
      <a href="{{ url('/') }}#gabung-mitra" class="nav-link">Gabung Mitra</a>
    </div>

    <!-- Right Actions (CTA & Hamburger) -->
    <div class="nav-right-actions">
      <button class="btn-nav-cta" onclick="openModal('passenger')">Unduh Aplikasi</button>
      
      <!-- Hamburger (mobile only) -->
      <button class="hamburger" id="hamburger" aria-label="Buka Menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>

  </div>

  <!-- ── Mobile Menu Dropdown ── -->
  <div class="mobile-menu-dropdown" id="mobileMenu">
    <a href="{{ url('/') }}#beranda"      class="nav-link-mobile">Beranda</a>
    <a href="{{ url('/') }}#fitur"        class="nav-link-mobile">Fitur Utama</a>
    <a href="{{ url('/') }}#cara-kerja"   class="nav-link-mobile">Cara Kerja</a>
    <a href="{{ url('/') }}#gabung-mitra" class="nav-link-mobile">Gabung Mitra</a>
  </div>
</nav>
