(function() {
  'use strict';

  if (!location.search.includes('review')) return;

  var API = '/api/reviews';
  var PAGE = location.pathname;
  var REVIEWER = null;
  var pins = [];
  var pinMode = false;
  var panelOpen = true;

  // ── Inject Styles ──
  var style = document.createElement('style');
  style.textContent = [
    '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap");',

    '#rv-overlay * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Inter", system-ui, sans-serif; }',

    /* Panel */
    '#rv-panel {',
    '  position: fixed; top: 0; right: 0; width: 380px; height: 100vh; z-index: 99999;',
    '  background: #111214; color: #e8e6e3; border-left: 1px solid rgba(255,255,255,.06);',
    '  display: flex; flex-direction: column; transition: transform .35s cubic-bezier(.4,0,.2,1);',
    '  box-shadow: -8px 0 40px rgba(0,0,0,.5);',
    '}',
    '#rv-panel.collapsed { transform: translateX(100%); }',

    /* Panel header */
    '#rv-panel-header {',
    '  padding: 20px 24px 16px; border-bottom: 1px solid rgba(255,255,255,.06);',
    '  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;',
    '}',
    '#rv-panel-header h2 {',
    '  font-family: "DM Mono", monospace; font-size: 10px; font-weight: 500;',
    '  letter-spacing: .15em; text-transform: uppercase; color: rgba(255,255,255,.4);',
    '}',
    '#rv-page-label { font-size: 13px; font-weight: 500; color: #fff; margin-top: 4px; }',

    /* Controls */
    '.rv-btn {',
    '  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);',
    '  color: #e8e6e3; font-size: 12px; font-weight: 500; padding: 8px 14px;',
    '  border-radius: 6px; cursor: pointer; transition: all .15s; font-family: "Inter", sans-serif;',
    '}',
    '.rv-btn:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.15); }',
    '.rv-btn--primary { background: #4A7FA5; border-color: #4A7FA5; color: #fff; }',
    '.rv-btn--primary:hover { background: #5a8fb5; }',
    '.rv-btn--pin { background: rgba(74,127,165,.15); border-color: #4A7FA5; color: #4A7FA5; }',
    '.rv-btn--pin.active { background: #4A7FA5; color: #fff; }',
    '.rv-btn--ghost { background: none; border: none; color: rgba(255,255,255,.4); padding: 6px; }',
    '.rv-btn--ghost:hover { color: #fff; }',

    /* Pin mode bar */
    '#rv-pin-bar {',
    '  padding: 12px 24px; border-bottom: 1px solid rgba(255,255,255,.06);',
    '  display: flex; gap: 8px; align-items: center; flex-shrink: 0;',
    '}',

    /* Comment list */
    '#rv-comments {',
    '  flex: 1; overflow-y: auto; padding: 16px 24px;',
    '  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.1) transparent;',
    '}',
    '.rv-comment {',
    '  padding: 16px; margin-bottom: 12px; background: rgba(255,255,255,.03);',
    '  border: 1px solid rgba(255,255,255,.05); border-radius: 8px;',
    '  transition: border-color .15s; position: relative;',
    '}',
    '.rv-comment:hover { border-color: rgba(255,255,255,.12); }',
    '.rv-comment.has-pin { cursor: pointer; }',
    '.rv-comment.has-pin:hover { border-color: #4A7FA5; }',
    '.rv-comment-header {',
    '  display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;',
    '}',
    '.rv-comment-author {',
    '  font-weight: 600; font-size: 13px; color: #fff;',
    '}',
    '.rv-comment-time {',
    '  font-family: "DM Mono", monospace; font-size: 10px; color: rgba(255,255,255,.25);',
    '}',
    '.rv-comment-body { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,.65); }',
    '.rv-comment-pin-badge {',
    '  display: inline-flex; align-items: center; gap: 4px; margin-top: 8px;',
    '  font-family: "DM Mono", monospace; font-size: 9px; letter-spacing: .1em;',
    '  text-transform: uppercase; color: #4A7FA5; opacity: .7;',
    '}',
    '.rv-comment.resolved { opacity: .4; }',
    '.rv-comment.resolved .rv-comment-body { text-decoration: line-through; }',
    '.rv-resolve-btn {',
    '  position: absolute; top: 12px; right: 12px; background: none; border: none;',
    '  color: rgba(255,255,255,.2); cursor: pointer; font-size: 14px; padding: 4px;',
    '  transition: color .15s; line-height: 1;',
    '}',
    '.rv-resolve-btn:hover { color: #2d7a4f; }',

    /* New comment form */
    '#rv-form {',
    '  padding: 16px 24px 20px; border-top: 1px solid rgba(255,255,255,.06); flex-shrink: 0;',
    '}',
    '#rv-form textarea {',
    '  width: 100%; min-height: 72px; padding: 12px; background: rgba(255,255,255,.04);',
    '  border: 1px solid rgba(255,255,255,.08); border-radius: 6px; color: #e8e6e3;',
    '  font-size: 13px; font-family: "Inter", sans-serif; resize: vertical; line-height: 1.5;',
    '  transition: border-color .15s;',
    '}',
    '#rv-form textarea:focus { outline: none; border-color: #4A7FA5; }',
    '#rv-form textarea::placeholder { color: rgba(255,255,255,.2); }',
    '#rv-form-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }',
    '#rv-pin-indicator {',
    '  font-family: "DM Mono", monospace; font-size: 10px; color: #4A7FA5;',
    '  letter-spacing: .05em;',
    '}',

    /* Page pins */
    '.rv-pin {',
    '  position: absolute; z-index: 99990; width: 28px; height: 28px;',
    '  background: #4A7FA5; border: 2px solid #fff; border-radius: 50%;',
    '  box-shadow: 0 2px 12px rgba(0,0,0,.4); cursor: pointer;',
    '  display: flex; align-items: center; justify-content: center;',
    '  font-family: "DM Mono", monospace; font-size: 10px; font-weight: 600; color: #fff;',
    '  transform: translate(-50%, -50%); transition: transform .15s, box-shadow .15s;',
    '  pointer-events: auto;',
    '}',
    '.rv-pin:hover { transform: translate(-50%, -50%) scale(1.15); box-shadow: 0 4px 20px rgba(74,127,165,.5); }',
    '.rv-pin.rv-pin--preview {',
    '  background: rgba(74,127,165,.6); border-style: dashed; animation: rv-pulse 1.5s infinite;',
    '}',

    '@keyframes rv-pulse {',
    '  0%, 100% { box-shadow: 0 0 0 0 rgba(74,127,165,.4); }',
    '  50% { box-shadow: 0 0 0 10px rgba(74,127,165,0); }',
    '}',

    /* Pin cursor */
    'body.rv-pinning { cursor: crosshair !important; }',
    'body.rv-pinning * { cursor: crosshair !important; }',

    /* Toggle button */
    '#rv-toggle {',
    '  position: fixed; top: 50%; right: 0; z-index: 99998; transform: translateY(-50%);',
    '  width: 36px; height: 80px; background: #111214; border: 1px solid rgba(255,255,255,.08);',
    '  border-right: none; border-radius: 8px 0 0 8px; cursor: pointer;',
    '  display: flex; align-items: center; justify-content: center; transition: all .2s;',
    '  color: rgba(255,255,255,.4);',
    '}',
    '#rv-toggle:hover { background: #1a1c1f; color: #fff; width: 40px; }',
    '#rv-panel:not(.collapsed) ~ #rv-toggle { right: 380px; }',

    /* Name modal */
    '#rv-name-modal {',
    '  position: fixed; inset: 0; z-index: 100000; background: rgba(0,0,0,.7);',
    '  backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;',
    '}',
    '#rv-name-card {',
    '  background: #111214; border: 1px solid rgba(255,255,255,.08); border-radius: 12px;',
    '  padding: 40px; width: 380px; text-align: center;',
    '  box-shadow: 0 24px 80px rgba(0,0,0,.6);',
    '}',
    '#rv-name-card h3 {',
    '  font-family: "DM Mono", monospace; font-size: 10px; font-weight: 500;',
    '  letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.3);',
    '  margin-bottom: 16px;',
    '}',
    '#rv-name-card p {',
    '  font-size: 14px; color: rgba(255,255,255,.5); margin-bottom: 24px; line-height: 1.6;',
    '}',
    '#rv-name-input {',
    '  width: 100%; padding: 14px 16px; background: rgba(255,255,255,.04);',
    '  border: 1px solid rgba(255,255,255,.1); border-radius: 8px; color: #fff;',
    '  font-size: 15px; font-family: "Inter", sans-serif; text-align: center;',
    '  transition: border-color .15s;',
    '}',
    '#rv-name-input:focus { outline: none; border-color: #4A7FA5; }',
    '#rv-name-input::placeholder { color: rgba(255,255,255,.2); }',
    '#rv-name-submit {',
    '  margin-top: 16px; width: 100%; padding: 14px; background: #4A7FA5; border: none;',
    '  border-radius: 8px; color: #fff; font-size: 14px; font-weight: 600;',
    '  font-family: "Inter", sans-serif; cursor: pointer; transition: background .15s;',
    '}',
    '#rv-name-submit:hover { background: #5a8fb5; }',

    /* Empty state */
    '.rv-empty {',
    '  text-align: center; padding: 48px 24px; color: rgba(255,255,255,.2);',
    '}',
    '.rv-empty-icon { font-size: 32px; margin-bottom: 12px; opacity: .4; }',
    '.rv-empty p { font-size: 13px; line-height: 1.6; }',

    /* Counter badge */
    '.rv-count {',
    '  background: #4A7FA5; color: #fff; font-size: 10px; font-weight: 700;',
    '  min-width: 18px; height: 18px; border-radius: 9px; display: inline-flex;',
    '  align-items: center; justify-content: center; padding: 0 5px;',
    '  font-family: "DM Mono", monospace;',
    '}',

    /* Page body shift */
    'body.rv-active { margin-right: 380px; transition: margin-right .35s cubic-bezier(.4,0,.2,1); }',
    'body.rv-collapsed { margin-right: 0; }',

    '@media (max-width: 768px) {',
    '  #rv-panel { width: 100%; }',
    '  body.rv-active { margin-right: 0; }',
    '  #rv-panel:not(.collapsed) ~ #rv-toggle { right: 100%; }',
    '}',
  ].join('\n');
  document.head.appendChild(style);

  // ── Build DOM ──
  var overlay = document.createElement('div');
  overlay.id = 'rv-overlay';
  overlay.innerHTML = [
    '<div id="rv-panel">',
    '  <div id="rv-panel-header">',
    '    <div>',
    '      <h2>Site Review</h2>',
    '      <div id="rv-page-label"></div>',
    '    </div>',
    '    <div style="display:flex;gap:6px;align-items:center;">',
    '      <span class="rv-count" id="rv-count">0</span>',
    '    </div>',
    '  </div>',
    '  <div id="rv-pin-bar">',
    '    <button class="rv-btn rv-btn--pin" id="rv-pin-toggle" title="Drop a pin on the page">',
    '      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    '      Pin + Comment',
    '    </button>',
    '    <button class="rv-btn" id="rv-general-btn" title="Leave a general note">',
    '      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    '      Note',
    '    </button>',
    '  </div>',
    '  <div id="rv-comments"></div>',
    '  <div id="rv-form" style="display:none;">',
    '    <textarea id="rv-textarea" placeholder="Describe the change you want..."></textarea>',
    '    <div id="rv-form-actions">',
    '      <span id="rv-pin-indicator"></span>',
    '      <div style="display:flex;gap:8px;">',
    '        <button class="rv-btn" id="rv-cancel">Cancel</button>',
    '        <button class="rv-btn rv-btn--primary" id="rv-submit">Send</button>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</div>',
    '<button id="rv-toggle" title="Toggle review panel">',
    '  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    '</button>',
  ].join('\n');
  document.body.appendChild(overlay);

  var pageLabel = document.getElementById('rv-page-label');
  var countBadge = document.getElementById('rv-count');
  var commentsList = document.getElementById('rv-comments');
  var form = document.getElementById('rv-form');
  var textarea = document.getElementById('rv-textarea');
  var pinIndicator = document.getElementById('rv-pin-indicator');
  var panel = document.getElementById('rv-panel');
  var pinToggle = document.getElementById('rv-pin-toggle');
  var generalBtn = document.getElementById('rv-general-btn');
  var cancelBtn = document.getElementById('rv-cancel');
  var submitBtn = document.getElementById('rv-submit');
  var toggleBtn = document.getElementById('rv-toggle');

  var pendingPin = null;
  var previewPinEl = null;

  var pageName = PAGE.replace('/site/', '').replace('.html', '') || 'home';
  pageLabel.textContent = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  document.body.classList.add('rv-active');

  // ── Name Modal ──
  function askName() {
    return new Promise(function(resolve) {
      var saved = null;
      try { saved = localStorage.getItem('rv-reviewer'); } catch(e) {}
      if (saved) { REVIEWER = saved; return resolve(); }

      var modal = document.createElement('div');
      modal.id = 'rv-name-modal';
      modal.innerHTML = [
        '<div id="rv-name-card">',
        '  <h3>Site Review</h3>',
        '  <p>Your feedback is saved and shared with the team. What\'s your name?</p>',
        '  <input type="text" id="rv-name-input" placeholder="e.g. Mark, Tony" autofocus>',
        '  <button id="rv-name-submit">Start Reviewing</button>',
        '</div>',
      ].join('');
      document.body.appendChild(modal);

      var input = document.getElementById('rv-name-input');
      var submit = document.getElementById('rv-name-submit');

      function go() {
        var name = input.value.trim();
        if (!name) return;
        REVIEWER = name;
        try { localStorage.setItem('rv-reviewer', name); } catch(e) {}
        modal.remove();
        resolve();
      }
      submit.addEventListener('click', go);
      input.addEventListener('keydown', function(e) { if (e.key === 'Enter') go(); });
    });
  }

  // ── API ──
  function fetchComments() {
    return fetch(API + '?page=' + encodeURIComponent(PAGE) + '&status=all')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        pins = data;
        renderComments();
        renderPins();
      })
      .catch(function() {
        commentsList.innerHTML = '<div class="rv-empty"><div class="rv-empty-icon">⚠</div><p>Could not load comments.<br>The review table may not exist yet.</p></div>';
      });
  }

  function postComment(comment, pinX, pinY) {
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: PAGE,
        reviewer: REVIEWER,
        comment: comment,
        pin_x: pinX,
        pin_y: pinY,
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function() { return fetchComments(); });
  }

  function resolveComment(id) {
    return fetch(API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, status: 'resolved' }),
    })
    .then(function() { return fetchComments(); });
  }

  // ── Render ──
  function timeAgo(dateStr) {
    var diff = Date.now() - new Date(dateStr).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    return days + 'd ago';
  }

  function renderComments() {
    var open = pins.filter(function(p) { return p.status === 'open'; });
    var resolved = pins.filter(function(p) { return p.status === 'resolved'; });
    countBadge.textContent = open.length;

    if (pins.length === 0) {
      commentsList.innerHTML = '<div class="rv-empty"><div class="rv-empty-icon">💬</div><p>No feedback yet.<br>Drop a pin or leave a note.</p></div>';
      return;
    }

    var html = '';
    open.forEach(function(c, i) {
      html += '<div class="rv-comment' + (c.pin_x != null ? ' has-pin' : '') + '" data-id="' + c.id + '"' +
        (c.pin_x != null ? ' data-px="' + c.pin_x + '" data-py="' + c.pin_y + '"' : '') + '>';
      html += '<button class="rv-resolve-btn" data-resolve="' + c.id + '" title="Mark resolved">✓</button>';
      html += '<div class="rv-comment-header">';
      html += '<span class="rv-comment-author">' + escHtml(c.reviewer) + '</span>';
      html += '<span class="rv-comment-time">' + timeAgo(c.created_at) + '</span>';
      html += '</div>';
      html += '<div class="rv-comment-body">' + escHtml(c.comment) + '</div>';
      if (c.pin_x != null) {
        html += '<div class="rv-comment-pin-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Pinned</div>';
      }
      html += '</div>';
    });

    if (resolved.length > 0) {
      html += '<div style="font-family:DM Mono,monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.2);padding:16px 0 8px;">Resolved (' + resolved.length + ')</div>';
      resolved.forEach(function(c) {
        html += '<div class="rv-comment resolved" data-id="' + c.id + '">';
        html += '<div class="rv-comment-header">';
        html += '<span class="rv-comment-author">' + escHtml(c.reviewer) + '</span>';
        html += '<span class="rv-comment-time">' + timeAgo(c.created_at) + '</span>';
        html += '</div>';
        html += '<div class="rv-comment-body">' + escHtml(c.comment) + '</div>';
        html += '</div>';
      });
    }

    commentsList.innerHTML = html;

    // Resolve buttons
    commentsList.querySelectorAll('[data-resolve]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        resolveComment(this.getAttribute('data-resolve'));
      });
    });

    // Click to scroll to pin
    commentsList.querySelectorAll('.rv-comment.has-pin').forEach(function(el) {
      el.addEventListener('click', function() {
        var px = parseFloat(this.getAttribute('data-px'));
        var py = parseFloat(this.getAttribute('data-py'));
        var absY = py * document.documentElement.scrollHeight;
        window.scrollTo({ top: absY - window.innerHeight / 3, behavior: 'smooth' });
        // Flash the pin
        var pinEl = document.querySelector('.rv-pin[data-id="' + this.getAttribute('data-id') + '"]');
        if (pinEl) {
          pinEl.style.transform = 'translate(-50%, -50%) scale(1.6)';
          setTimeout(function() { pinEl.style.transform = ''; }, 400);
        }
      });
    });
  }

  function renderPins() {
    document.querySelectorAll('.rv-pin:not(.rv-pin--preview)').forEach(function(p) { p.remove(); });

    var openPins = pins.filter(function(p) { return p.status === 'open' && p.pin_x != null; });
    openPins.forEach(function(c, i) {
      var pin = document.createElement('div');
      pin.className = 'rv-pin';
      pin.setAttribute('data-id', c.id);
      pin.textContent = i + 1;
      pin.style.left = (c.pin_x * 100) + '%';
      pin.style.top = (c.pin_y * document.documentElement.scrollHeight) + 'px';
      pin.title = c.reviewer + ': ' + c.comment.substring(0, 80);
      pin.addEventListener('click', function() {
        var el = commentsList.querySelector('[data-id="' + c.id + '"]');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.borderColor = '#4A7FA5';
          setTimeout(function() { el.style.borderColor = ''; }, 1500);
        }
      });
      document.body.appendChild(pin);
    });
  }

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Pin Mode ──
  pinToggle.addEventListener('click', function() {
    if (pinMode) return exitPinMode();
    enterPinMode();
  });

  function enterPinMode() {
    pinMode = true;
    pinToggle.classList.add('active');
    document.body.classList.add('rv-pinning');
    pinIndicator.textContent = 'Click the page to place a pin';
  }

  function exitPinMode() {
    pinMode = false;
    pinToggle.classList.remove('active');
    document.body.classList.remove('rv-pinning');
    pinIndicator.textContent = '';
    if (previewPinEl) { previewPinEl.remove(); previewPinEl = null; }
    pendingPin = null;
  }

  document.addEventListener('click', function(e) {
    if (!pinMode) return;
    if (e.target.closest('#rv-overlay')) return;

    e.preventDefault();
    e.stopPropagation();

    var x = e.pageX / document.documentElement.scrollWidth;
    var y = e.pageY / document.documentElement.scrollHeight;

    pendingPin = { x: x, y: y };

    if (previewPinEl) previewPinEl.remove();
    previewPinEl = document.createElement('div');
    previewPinEl.className = 'rv-pin rv-pin--preview';
    previewPinEl.textContent = '?';
    previewPinEl.style.left = (x * 100) + '%';
    previewPinEl.style.top = e.pageY + 'px';
    document.body.appendChild(previewPinEl);

    pinIndicator.textContent = '📍 Pin placed — add your note';
    document.body.classList.remove('rv-pinning');
    pinMode = false;
    pinToggle.classList.remove('active');

    form.style.display = 'block';
    textarea.focus();
  }, true);

  // ── General Note ──
  generalBtn.addEventListener('click', function() {
    exitPinMode();
    pendingPin = null;
    pinIndicator.textContent = '';
    form.style.display = 'block';
    textarea.focus();
  });

  // ── Submit / Cancel ──
  cancelBtn.addEventListener('click', function() {
    form.style.display = 'none';
    textarea.value = '';
    exitPinMode();
  });

  submitBtn.addEventListener('click', function() {
    var text = textarea.value.trim();
    if (!text) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    var px = pendingPin ? pendingPin.x : null;
    var py = pendingPin ? pendingPin.y : null;

    postComment(text, px, py).then(function() {
      form.style.display = 'none';
      textarea.value = '';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send';
      exitPinMode();
    });
  });

  textarea.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      submitBtn.click();
    }
  });

  // ── Toggle Panel ──
  toggleBtn.addEventListener('click', function() {
    panelOpen = !panelOpen;
    panel.classList.toggle('collapsed', !panelOpen);
    document.body.classList.toggle('rv-collapsed', !panelOpen);
  });

  // ── Init ──
  askName().then(function() {
    fetchComments();
    // Poll every 30s for new comments from others
    setInterval(fetchComments, 30000);
  });

  // Reposition pins on scroll/resize
  window.addEventListener('resize', renderPins);

})();
