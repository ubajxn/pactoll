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

  // ===================== QUOTE WIZARD MODAL =====================
  var overlay = document.getElementById('quote-modal');
  if (!overlay) return;

  var modal = overlay.querySelector('.modal');
  var form = document.getElementById('quote-form');
  var successEl = overlay.querySelector('.modal__success');
  var closeBtn = overlay.querySelector('.modal__close');
  var wizardNav = overlay.querySelector('.wizard__nav');
  var steps = overlay.querySelectorAll('.wizard__step');
  var progressBar = overlay.querySelector('.wizard__progress-bar');
  var stepLabel = overlay.querySelector('.wizard__current');
  var backBtn = overlay.querySelector('.wizard__btn--back');
  var nextBtn = overlay.querySelector('.wizard__btn--next');
  var totalSteps = steps.length;
  var currentStep = 1;

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

  var serviceLabels = {
    'slitting': 'Steel Slitting',
    'blanking': 'Multi-Blanking',
    'leveling': 'Precision Leveling',
    'ctl': 'Cut-to-Length',
    'steel-sales': 'Steel Sales',
    'other': 'Other'
  };

  var materialLabels = {
    'hot-rolled': 'Hot-Rolled Steel',
    'cold-rolled': 'Cold-Rolled Steel',
    'galvanized': 'Galvanized Steel',
    'galvanneal': 'Galvanneal',
    'stainless': 'Stainless Steel',
    'other': 'Other'
  };

  var timelineLabels = {
    'asap': 'ASAP / Rush',
    '1-2weeks': '1-2 Weeks',
    '2-4weeks': '2-4 Weeks',
    'flexible': 'Flexible'
  };

  var taglineEl = overlay.querySelector('.modal__tagline');

  function goToStep(n) {
    currentStep = n;
    steps.forEach(function(s) { s.classList.remove('active'); });
    var target = overlay.querySelector('[data-step="' + n + '"]');
    if (target) target.classList.add('active');
    progressBar.style.width = (n / totalSteps * 100) + '%';
    stepLabel.textContent = n;
    backBtn.classList.toggle('hidden', n === 1);
    if (n === totalSteps) {
      nextBtn.style.display = 'none';
      populateReview();
    } else {
      nextBtn.style.display = '';
    }
    wizardNav.style.display = '';
    modal.scrollTop = 0;
  }

  function populateReview() {
    var svc = form.querySelector('[name="service"]:checked');
    document.getElementById('review-service').textContent = svc ? (serviceLabels[svc.value] || svc.value) : '—';
    var mat = form.querySelector('[name="material"]');
    document.getElementById('review-material').textContent = mat && mat.value ? (materialLabels[mat.value] || mat.value) : '—';
    document.getElementById('review-gauge').textContent = form.querySelector('[name="gauge"]').value || '—';
    document.getElementById('review-width').textContent = form.querySelector('[name="width"]').value || '—';
    document.getElementById('review-quantity').textContent = form.querySelector('[name="quantity"]').value || '—';
    var tl = form.querySelector('[name="timeline"]');
    document.getElementById('review-timeline').textContent = tl && tl.value ? (timelineLabels[tl.value] || tl.value) : '—';
    document.getElementById('review-name').textContent = form.querySelector('[name="name"]').value || '—';
    document.getElementById('review-email').textContent = form.querySelector('[name="email"]').value || '—';
  }

  function validateStep(n) {
    if (n === 1) {
      var checked = form.querySelector('[name="service"]:checked');
      if (!checked) {
        var cards = overlay.querySelectorAll('.wizard__card-inner');
        cards.forEach(function(c) {
          c.style.borderColor = 'rgba(200,50,50,.4)';
          setTimeout(function() { c.style.borderColor = ''; }, 1200);
        });
        return false;
      }
    }
    if (n === 3) {
      var name = form.querySelector('[name="name"]');
      var email = form.querySelector('[name="email"]');
      if (!name.value.trim() || !email.value.trim() || !email.checkValidity()) {
        if (!name.value.trim()) name.style.borderBottomColor = 'rgba(200,50,50,.6)';
        if (!email.value.trim() || !email.checkValidity()) email.style.borderBottomColor = 'rgba(200,50,50,.6)';
        setTimeout(function() {
          name.style.borderBottomColor = '';
          email.style.borderBottomColor = '';
        }, 1500);
        return false;
      }
    }
    return true;
  }

  nextBtn.addEventListener('click', function() {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) goToStep(currentStep + 1);
  });

  backBtn.addEventListener('click', function() {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  // Auto-advance on card selection (step 1)
  overlay.querySelectorAll('.wizard__card input').forEach(function(radio) {
    radio.addEventListener('change', function() {
      setTimeout(function() { goToStep(2); }, 300);
    });
  });

  function openModal(service) {
    if (taglineEl) {
      taglineEl.textContent = taglines[Math.floor(Math.random() * taglines.length)];
    }
    if (service && serviceLabels[service]) {
      var radio = form.querySelector('[name="service"][value="' + service + '"]');
      if (radio) radio.checked = true;
      goToStep(2);
    } else {
      goToStep(1);
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
    wizardNav.style.display = '';
    form.reset();
    goToStep(1);
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
    var submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    var data = new FormData(form);
    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function(r) {
      if (r.ok) {
        form.style.display = 'none';
        wizardNav.style.display = 'none';
        successEl.classList.add('show');
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
      }
    }).catch(function() {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Request';
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
