/* "From chaos to calm": a pinned section on the home page where scrolling plays
   the desk-cleanup animation forward and backward, frame by frame, with captions.
   Frames live in /scrolly/desk/ (d-001.webp... for computers, m-001.webp... for phones). */
(function () {
  var FRAMES = 119;
  var DIR = '/scrolly/desk/';
  var BOOK = 'https://calendly.com/mpinhas100/30min';
  var CAPS = [
    { at: 0.00, hero: true },
    { at: 0.14, k: 'A normal day', h: 'Sound familiar?', p: 'Phones ringing. Notes everywhere. An inbox that never ends.' },
    { at: 0.32, k: 'Step 1', h: 'AI picks up the busywork.', p: 'Calls answered, follow-ups sent, nothing forgotten.' },
    { at: 0.50, k: 'Step 2', h: 'Your inbox, under control.', p: 'Emails sorted and answered, so you can focus on clients.' },
    { at: 0.68, k: 'Step 3', h: 'Paperwork, handled.', p: 'Admin and scheduling run quietly in the background.' },
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
      if (c.hero) return '<div class="scrolly-cap scrolly-hero on" data-i="0"></div>';
      return '<div class="scrolly-cap' + (c.cta ? ' scrolly-final' : '') + (i === 0 ? ' on' : '') + '" data-i="' + i + '">' +
        '<span class="k">' + c.k + '</span><h2>' + c.h + '</h2><p>' + c.p + '</p>' +
        (c.cta ? '<a class="btn btn-primary" href="' + BOOK + '" target="_blank" rel="noopener">Book a free consultation</a>' : '') +
        '</div>';
    }).join('');
    sec.innerHTML = '<div class="scrolly-pin"><div class="scrolly-grid">' +
      '<div class="scrolly-copy">' + caps + '</div>' +
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
        capEls[capIndex].classList.remove('on');
        capEls[ci].classList.add('on');
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

    // Mouse wheel / trackpad over the video: the video plays at a steady pace and the page
    // stays on it until the video reaches its end (or its start, scrolling up). A fast flick
    // can't skip past it; after the end, a new scroll gesture moves on to the rest of the page.
    var stage = full ? sec.querySelector('.scrolly-pin') : sec.querySelector('.scrolly-stage');
    var hold = 0, holdTimer = 0, STEP = 45; // px of page scroll per wheel event, at most
    function range() {
      var top = sec.getBoundingClientRect().top + window.scrollY - 68;
      return [top, top + sec.offsetHeight - (window.innerHeight - 68)];
    }
    stage.addEventListener('wheel', function (e) {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // pinch-zoom or sideways
      var d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (!d) return;
      var r = range(), y = window.scrollY, inside = y >= r[0] - 2 && y <= r[1] + 2;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () { hold = 0; }, 320);
      if (hold && (hold > 0) === (d > 0)) { e.preventDefault(); return; } // same gesture hit an end: wait
      if (!inside) return;
      var atEnd = d > 0 ? y >= r[1] - 1 : y <= r[0] + 1;
      if (atEnd) return; // fresh gesture at an end: let the page move on
      e.preventDefault();
      var next = Math.min(r[1], Math.max(r[0], y + Math.max(-STEP, Math.min(STEP, d))));
      window.scrollTo({ top: next, behavior: 'instant' });
      if (next >= r[1] - 1 || next <= r[0] + 1) hold = d > 0 ? 1 : -1;
    }, { passive: false });
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
    // The video is the opening of the page: move the welcome content (logo, tagline, buttons)
    // into the first caption and put the video where the old opening section was.
    var content = hero.querySelector('.wrap > div');
    if (content) sec.querySelector('.scrolly-hero').appendChild(content);
    hero.parentNode.insertBefore(sec, hero);
    hero.hidden = true;
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
