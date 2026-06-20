<!-- Footer component -->
<footer class="footer-light" id="footer" style="background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
  <div style="max-width:1200px;margin:0 auto;padding:4rem 1.5rem 2rem;">

    <!-- Top Grid -->
    <div class="grid-footer-top">

      <!-- Left: Logo + Address/Desc -->
      <div>
        <!-- Logo -->
        <a href="{{ url('/') }}" style="display:inline-flex;align-items:center;gap:0.75rem;text-decoration:none;margin-bottom:1rem;">
          <img src="{{ asset('landing-assets/img/Logo_FivGo.png') }}" alt="FivGo Logo" style="height:60px;"/>
          <span style="font-size:1.6rem;font-weight:800;color:var(--blue);letter-spacing:-0.02em;">FivGo</span>
        </a>
        
        <p style="color:var(--text-m);font-size:0.875rem;line-height:1.6;max-width:320px;">
          FIVGO adalah layanan transportasi online yang menghubungkan pengguna dan mitra driver untuk perjalanan yang lebih mudah dan nyaman.
        </p>
      </div>

      <!-- Right: Links (3 columns) -->
      <div class="grid-footer-links">
        
        <!-- Col 1 -->
        <div>
          <h5 style="color:var(--text-h);font-size:0.85rem;font-weight:600;margin-bottom:1.25rem;">Navigasi</h5>
          <div style="display:flex;flex-direction:column;gap:0.85rem;">
            <a href="{{ url('/') }}#beranda" class="footer-link-light">Beranda</a>
            <a href="{{ url('/') }}#fitur" class="footer-link-light">Fitur Utama</a>
            <a href="{{ url('/') }}#cara-kerja" class="footer-link-light">Cara Kerja</a>
            <a href="{{ url('/') }}#gabung-mitra" class="footer-link-light">Gabung Mitra</a>
          </div>
        </div>

        <!-- Col 2 -->
        <div>
          <h5 style="color:var(--text-h);font-size:0.85rem;font-weight:600;margin-bottom:1.25rem;">Legal</h5>
          <div style="display:flex;flex-direction:column;gap:0.85rem;">
            <a href="{{ url('/syarat-ketentuan') }}" class="footer-link-light">Syarat &amp; Ketentuan</a>
            <a href="{{ url('/kebijakan-privasi') }}" class="footer-link-light">Kebijakan Privasi</a>
          </div>
        </div>

        <!-- Col 3 -->
        <div>
          <h5 style="color:var(--text-h);font-size:0.85rem;font-weight:600;margin-bottom:1.25rem;">Aplikasi</h5>
          <div style="display:flex;flex-direction:column;gap:0.85rem;">
            <a href="#" class="footer-link-light" onclick="openModal('passenger'); return false;">Aplikasi Penumpang</a>
            <a href="#" class="footer-link-light" onclick="openModal('driver'); return false;">Aplikasi Driver</a>
            
          </div>
        </div>

        <!-- Col 4 -->
        <div>
          <h5 style="color:var(--text-h);font-size:0.85rem;font-weight:600;margin-bottom:1.25rem;">Hubungi Kami</h5>
          <div style="display:flex;flex-direction:column;gap:0.85rem;">
            <a href="mailto:fivgoubp@gmail.com" class="footer-link-light" style="display:flex;align-items:center;gap:0.5rem;"><i class="fa-solid fa-envelope" style="color:var(--amber);"></i> fivgoubp@gmail.com</a>
            <a href="tel:+6289501858234" class="footer-link-light" style="display:flex;align-items:center;gap:0.5rem;"><i class="fa-solid fa-phone" style="color:var(--amber);"></i> +62 895-0185-8234</a>
            <span style="color:var(--text-m);font-size:0.85rem;line-height:1.6;display:flex;align-items:flex-start;gap:0.5rem;">
              <i class="fa-solid fa-location-dot" style="color:var(--amber);margin-top:0.25rem;"></i>
              <span>Jl. H.S. Ronggowaluyo, Teluk Jambe, Karawang<br>Kabupaten Karawang - Jawa Barat</span>
            </span>
          </div>
        </div>

      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="footer-bottom-bar">
      <p style="color:var(--text-m);font-size:0.85rem;margin:0;">
        &copy; 2026 FivGo. All rights reserved.
      </p>
    </div>

  </div>
</footer>
