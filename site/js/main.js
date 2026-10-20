document.addEventListener('DOMContentLoaded', function() {
  var nav = document.querySelector('.nav');
  var hamburger = document.querySelector('.nav__hamburger');
  var navLinks = document.querySelector('.nav__links');

  // Mobile nav
  if (hamburger) {
    hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('open');
      var spans = hamburger.querySelectorAll('span');
      if (navLinks.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }

  document.querySelectorAll('.nav__links a').forEach(function(link) {
    link.addEventListener('click', function() {
      if (navLinks) navLinks.classList.remove('open');
      if (hamburger) {
        hamburger.querySelectorAll('span').forEach(function(s) {
          s.style.transform = '';
          s.style.opacity = '';
        });
      }
    });
  });

  // Nav scroll state
  function checkScroll() {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', checkScroll);
  checkScroll();

  // Fade-up on scroll
  var fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    fadeEls.forEach(function(el) { observer.observe(el); });
  }

  // Dynamic copyright year
  var yearEls = document.querySelectorAll('.copyright-year');
  var currentYear = new Date().getFullYear();
  yearEls.forEach(function(el) { el.textContent = currentYear; });

  // Active nav link
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(function(link) {
    var href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Smooth scroll for anchors
  document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===================== QUOTE MODAL =====================
  var overlay = document.getElementById('quote-modal');
  if (!overlay) return;

  var modal = overlay.querySelector('.modal');
  var form = document.getElementById('quote-form');
  var successEl = overlay.querySelector('.modal__success');
  var closeBtn = overlay.querySelector('.modal__close');

  var taglines = [
    "Let's forge something great together.",
    "Steel yourself — this quote is free.",
    "We're not just winging it. We're slitting it.",
    "Cut to the chase. We'll cut to length.",
    "You bring the specs, we bring the steel.",
    "Flat out the best in the West.",
    "We don't steel your time — we save it.",
    "Precision is our edge. Literally.",
    "No pressure. Well, maybe a little tonnage.",
    "Let's get this coil rolling.",
    "We measure twice so you don't have to.",
    "Your next move? A steel one.",
    "Heavy metal, handled with care.",
    "We're on a roll. A steel roll.",
    "Ready to make the cut? So are we.",
    "The steeliest deal you'll find.",
    "We're cranking out quotes like coils.",
    "Bringing the heat since 1989.",
    "Sun-powered steel. The future is bright.",
    "We don't blanket statement — we multi-blank.",
    "Where every order is a cut above.",
    "Coil us maybe?",
    "Let's level with each other.",
    "No rust. No fuss. Just trust.",
    "Getting you from coil to done.",
    "Our quotes are sharper than our blades.",
    "We take the edge off — and put it on.",
    "Flat, fast, and fabrication-ready.",
    "Strong relationships. Stronger steel.",
    "We're not heavy — we're your partner.",
    "Let's slit the difference.",
    "Forged in Carson. Trusted everywhere.",
    "This is where steel meets the road.",
    "We're solar powered and steel powered.",
    "Green energy. Clean edges. Great steel.",
    "Your coil is our calling.",
    "We don't cut corners — just steel.",
    "Tolerance? Ours is ±0.005\".",
    "One source for steel and smiles.",
    "The only thing we level more than steel is the playing field."
  ];

  var taglineEl = overlay.querySelector('.modal__tagline');

  function openModal(service) {
    if (service) {
      var sel = form.querySelector('[name="service"]');
      if (sel) sel.value = service;
    }
    if (taglineEl) {
      taglineEl.textContent = taglines[Math.floor(Math.random() * taglines.length)];
    }
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function resetModal() {
    form.style.display = '';
    successEl.classList.remove('show');
    form.reset();
  }

  closeBtn.addEventListener('click', function() {
    closeModal();
    setTimeout(resetModal, 300);
  });

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      closeModal();
      setTimeout(resetModal, 300);
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeModal();
      setTimeout(resetModal, 300);
    }
  });

  // Intercept all quote/contact CTA links
  document.querySelectorAll('a[href="contact.html"], a[data-modal="quote"]').forEach(function(link) {
    // Skip nav links to the Contact page itself
    if (link.closest('.nav__links') || link.closest('.footer')) return;
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var service = this.getAttribute('data-service') || '';
      openModal(service);
    });
  });

  // Auto-open modal on contact page
  var isContactPage = window.location.pathname.endsWith('contact.html');
  if (isContactPage) {
    setTimeout(function() { openModal(); }, 600);
  }

  // Form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var data = new FormData(form);
    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function(r) {
      if (r.ok) {
        form.style.display = 'none';
        successEl.classList.add('show');
      }
    });
  });

  // ===================== COOKIE CONSENT =====================
  var cookieBar = document.getElementById('cookie-bar');
  if (cookieBar) {
    try {
      var consent = localStorage.getItem('ptp_cookie_consent');
    } catch(e) {
      var consent = null;
    }
    if (!consent) {
      setTimeout(function() { cookieBar.classList.add('show'); }, 1500);
    }
    cookieBar.querySelector('.cookie-bar__btn--accept').addEventListener('click', function() {
      try { localStorage.setItem('ptp_cookie_consent', 'accepted'); } catch(e) {}
      cookieBar.classList.remove('show');
    });
    cookieBar.querySelector('.cookie-bar__btn--decline').addEventListener('click', function() {
      try { localStorage.setItem('ptp_cookie_consent', 'declined'); } catch(e) {}
      cookieBar.classList.remove('show');
    });
  }
});
