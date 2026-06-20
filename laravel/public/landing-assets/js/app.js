// ── SMART NAVBAR (hide on scroll down, show on scroll up) ──
const navbar = document.getElementById('navbar');
let lastScrollY = 0;
let ticking = false;

function handleNavScroll() {
  const currentY = window.scrollY;

  // Always show at the very top
  if (currentY <= 10) {
    navbar.classList.remove('nav-hidden', 'scrolled');
    lastScrollY = currentY;
    ticking = false;
    return;
  }

  // Scrolled down → add blur background
  navbar.classList.add('scrolled');

  // Scroll DOWN → hide navbar
  if (currentY > lastScrollY + 5) {
    navbar.classList.add('nav-hidden');
  }
  // Scroll UP → show navbar
  else if (currentY < lastScrollY - 5) {
    navbar.classList.remove('nav-hidden');
  }

  lastScrollY = currentY;
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(handleNavScroll);
    ticking = true;
  }
}, { passive: true });

// Run once on load
handleNavScroll();

// ── SCROLL SPY (ACTIVE NAV LINK) ──
function scrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link, .nav-link-mobile');
  
  let currentId = '';
  
  sections.forEach(sec => {
    const sectionTop = sec.getBoundingClientRect().top;
    // Jika batas atas section sudah melewati 250px dari atas layar, kita anggap itu section yang aktif
    if (sectionTop <= 250) {
      currentId = sec.getAttribute('id');
    }
  });

  // Jika posisi masih di paling atas, aktifkan section pertama
  if (!currentId && sections.length > 0 && window.scrollY < 100) {
    currentId = sections[0].getAttribute('id');
  }

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (currentId && link.getAttribute('href').includes('#' + currentId)) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', scrollSpy, { passive: true });
scrollSpy();

// ── SMOOTH SCROLL ──
document.querySelectorAll('.nav-link, .nav-link-mobile').forEach(a => {
  a.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href && href.includes('#')) {
      const targetId = href.split('#')[1];
      const el = document.getElementById(targetId);
      
      // Jika elemen ditemukan di halaman yang sama
      if (el) {
        e.preventDefault();
        window.scrollTo({ 
          top: el.offsetTop - 80, 
          behavior: 'smooth' 
        });
        
        // Tutup menu mobile jika sedang terbuka
        if (typeof closeMobileMenu === 'function') closeMobileMenu();
      }
    }
  });
});


// ── MOBILE MENU ──
const hamburgerBtn = document.getElementById('hamburger');
const mobileMenu   = document.getElementById('mobileMenu');
const menuCloseBtn = document.getElementById('menuClose');

function openMobileMenu() {
  mobileMenu.classList.add('open');
  hamburgerBtn.classList.add('active');
  hamburgerBtn.setAttribute('aria-expanded', 'true');
}
function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburgerBtn.classList.remove('active');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
}

hamburgerBtn?.addEventListener('click', () => {
  mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
});
menuCloseBtn?.addEventListener('click', closeMobileMenu);

// Tutup menu saat link mobile diklik
mobileMenu?.querySelectorAll('.nav-link-mobile').forEach(link => {
  link.addEventListener('click', closeMobileMenu);
});

// Tutup menu saat klik di luar area navbar
document.addEventListener('click', (e) => {
  if (mobileMenu?.classList.contains('open') && !document.getElementById('navbar').contains(e.target)) {
    closeMobileMenu();
  }
});

// Tutup dengan tombol Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMobileMenu();
    closeModal();
  }
});

// ── MODAL ──
const modalOverlay = document.getElementById('downloadModal');
function openModal(type) {
  document.getElementById('modalType').innerHTML = type === 'passenger' 
    ? '<img src="/landing-assets/img/Logo_Customer.png" alt="Penumpang" style="height: 65px; display: inline-block;">' 
    : '<img src="/landing-assets/img/Logo_Driver.png" alt="Driver" style="height: 65px; display: inline-block;">';
  document.getElementById('modalTitle').textContent       = type === 'passenger' ? 'Penumpang' : 'Driver';
  document.getElementById('modalDescription').textContent = type === 'passenger'
    ? 'Terima kasih atas antusiasme Anda! Aplikasi FivGo Penumpang sedang dipersiapkan. Nantikan kehadiran kami segera di Google Play Store.'
    : 'Terima kasih atas antusiasme Anda! Aplikasi FivGo Driver sedang dipersiapkan. Mari bersiap menjadi bagian dari mitra kami segera!';
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}
modalOverlay?.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

// ── SCROLL REVEAL ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));

// ── COUNTER ANIMATION ──
function animateCount(el, target, suffix = '', duration = 1800) {
  const start = performance.now();
  const isDecimal = String(target).includes('.');
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const val = isDecimal ? (ease * target).toFixed(1) : Math.floor(ease * target);
    el.textContent = val + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      animateCount(el, parseFloat(el.dataset.target), el.dataset.suffix || '');
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// ── JOURNEY STATUS PULSE ──
const dots = document.querySelectorAll('.step-dot');
let active = 0;
setInterval(() => {
  dots.forEach((d, i) => { d.style.transform = i === active ? 'scale(1.3)' : 'scale(1)'; });
  active = (active + 1) % dots.length;
}, 1800);

// ── PARTNER MARQUEE (duplicate items) ──
const track = document.querySelector('.partner-track');
if (track) { track.innerHTML += track.innerHTML; }

// ── TYPED HEADLINE ──
const typedEl = document.getElementById('typedText');
if (typedEl) {
  const words = ['Teraman', 'Terpantau', 'Terjangkau'];
  let wi = 0, ci = 0, deleting = false;
  function typeLoop() {
    const word = words[wi];
    if (!deleting) {
      typedEl.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(typeLoop, 1800); return; }
    } else {
      typedEl.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
    }
    setTimeout(typeLoop, deleting ? 60 : 100);
  }
  setTimeout(typeLoop, 800);
}
