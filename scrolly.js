/* "From chaos to calm": a pinned section on the home page where scrolling plays
   the desk-cleanup animation forward and backward, frame by frame, with captions.
   Frames live in /scrolly/desk/ (d-001.webp... for computers, m-001.webp... for phones). */
(function () {
  var FRAMES = 119;
  var DIR = '/scrolly/desk/';
  var BOOK = 'https://calendly.com/mpinhas100/30min';
  var CAPS = [
    { at: 0.00, k: 'A normal day', h: 'Sound familiar?', p: 'Phones ringing. Notes everywhere. An inbox that never ends.' },
    { at: 0.22, k: 'Step 1', h: 'AI picks up the busywork.', p: 'Calls answered, follow-ups sent, nothing forgotten.' },
    { at: 0.45, k: 'Step 2', h: 'Your inbox, under control.', p: 'Emails sorted and answered, so you can focus on clients.' },
    { at: 0.66, k: 'Step 3', h: 'Paperwork, handled.', p: 'Admin and scheduling run quietly in the background.' },
    { at: 0.86, k: 'The result', h: 'Be <span class="ai">AI</span>-Ready.', p: 'Less busywork, more room to grow your business.', cta: true }
  ];
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function pad(n) { return ('00' + n).slice(-3); }
  function frameUrl(i, small) { return DIR + (small ? 'm-' : 'd-') + pad(i + 1) + '.webp'; }

  function build() {
    var sec = document.createElement('section');
    sec.className = 'scrolly';
    sec.setAttribute('aria-label', 'How AI turns a busy day into a calm one');
    var caps = CAPS.map(function (c, i) {
      return '<div class="scrolly-cap' + (c.cta ? ' scrolly-final' : '') + (i === 0 ? ' on' : '') + '" data-i="' + i + '">' +
        '<span class="k">' + c.k + '</span><h2>' + c.h + '</h2><p>' + c.p + '</p>' +
        (c.cta ? '<a class="btn btn-primary" href="' + BOOK + '" target="_blank" rel="noopener">Book a free consultation</a>' : '') +
        '</div>';
    }).join('');
    var dots = CAPS.map(function (_, i) { return '<span' + (i === 0 ? ' class="on"' : '') + '></span>'; }).join('');
    sec.innerHTML = '<div class="scrolly-pin"><div class="scrolly-grid">' +
      '<div class="scrolly-copy">' + caps + '<div class="scrolly-dots" aria-hidden="true">' + dots + '</div></div>' +
      '<div class="scrolly-stage"><canvas width="1280" height="720" role="img" aria-label="A cluttered office desk is tidied up by a small glowing AI helper until it is calm and organized."></canvas>' +
      '<div class="scrolly-bar" aria-hidden="true"><i></i></div></div>' +
      '</div></div>';
    return sec;
  }

  function wire(sec) {
    var small = window.innerWidth <= 820;
    var canvas = sec.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var full = !small && !reduce; // computers: full-screen, cropped to cover
    function sizeCanvas() {
      if (!full) { if (small) { canvas.width = 640; canvas.height = 360; } return; }
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      var k = Math.min(1, 2400 / Math.max(w, 1));
      canvas.width = Math.max(1, Math.round(w * k)); canvas.height = Math.max(1, Math.round(h * k));
    }
    sizeCanvas();
    var imgs = new Array(FRAMES), loaded = new Array(FRAMES);
    var capEls = sec.querySelectorAll('.scrolly-cap');
    var dotEls = sec.querySelectorAll('.scrolly-dots span');
    var bar = sec.querySelector('.scrolly-bar i');
    var current = -1, started = false;

    function load(i) {
      if (imgs[i]) return;
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () { loaded[i] = true; if (i === want || current < 0) draw(); };
      im.src = frameUrl(i, small);
      imgs[i] = im;
    }
    function loadAll() {
      if (started) return; started = true;
      // load every 8th frame first so scrubbing works early, then fill in the rest
      for (var s = 8; s >= 1; s = s >> 1) for (var i = 0; i < FRAMES; i += s) load(i);
    }
    var want = 0;
    function nearestLoaded(i) {
      for (var d = 0; d < FRAMES; d++) {
        if (i - d >= 0 && loaded[i - d]) return i - d;
        if (i + d < FRAMES && loaded[i + d]) return i + d;
      }
      return -1;
    }
    function draw() {
      var f = nearestLoaded(want);
      if (f < 0 || f === current) return;
      current = f;
      var im = imgs[f], cw = canvas.width, ch = canvas.height;
      if (!full) { ctx.drawImage(im, 0, 0, cw, ch); return; }
      var iw = im.naturalWidth, ih = im.naturalHeight, sc = Math.max(cw / iw, ch / ih);
      var dw = iw * sc, dh = ih * sc;
      ctx.drawImage(im, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }
    function progress() {
      var r = sec.getBoundingClientRect();
      var total = sec.offsetHeight - (window.innerHeight - 68);
      return Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
    }
    var capIndex = 0;
    function update() {
      var p = progress();
      want = Math.min(FRAMES - 1, Math.round(p * (FRAMES - 1)));
      draw();
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      var ci = 0;
      for (var i = 0; i < CAPS.length; i++) if (p >= CAPS[i].at) ci = i;
      if (ci !== capIndex) {
        capEls[capIndex].classList.remove('on'); dotEls[capIndex].classList.remove('on');
        capEls[ci].classList.add('on'); dotEls[ci].classList.add('on');
        capIndex = ci;
      }
    }

    if (reduce) {
      // still picture of the calm desk with the final message
      want = FRAMES - 1; load(FRAMES - 1);
      capEls[0].classList.remove('on'); capEls[CAPS.length - 1].classList.add('on');
      return;
    }
    load(0);
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) loadAll(); }, { rootMargin: '150% 0px' }).observe(sec);
    } else { loadAll(); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { sizeCanvas(); current = -1; onScroll(); });
    update();
  }

  function mount() {
    var app = document.getElementById('app');
    if (!app || document.body.classList.contains('editing')) return;
    if (app.querySelector('.scrolly')) return;
    var hero = app.querySelector('section.hero');
    if (!hero) return;
    var sec = build();
    hero.parentNode.insertBefore(sec, hero.nextSibling);
    wire(sec);
  }

  function start() {
    mount();
    // the home page can redraw itself (e.g. language switch); put the section back if it disappears
    var app = document.getElementById('app');
    if (app && 'MutationObserver' in window) new MutationObserver(function () { mount(); }).observe(app, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
