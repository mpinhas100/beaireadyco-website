/* "From chaos to calm": a pinned section on the home page where scrolling plays
   the desk-cleanup animation forward and backward, frame by frame, with captions.
   Frames live in /scrolly/desk/ (d-001.webp... for computers, m-001.webp... for phones). */
(function () {
  var FRAMES = 119;
  var DIR = '/scrolly/desk/';
  var BOOK = 'https://calendly.com/mpinhas100/30min';
  var CAPS = [
    { at: 0.00, hero: true },
    { at: 0.20, k: 'A normal day', h: 'Sound familiar?', p: 'Phones ringing. Notes everywhere. An inbox that never ends.' },
    { at: 0.50, k: 'Our Solution:', h: 'AI picks up the busywork.', p: 'Calls answered and follow-ups sent.<br>Emails sorted and answered.<br>Admin and scheduling handled in the background.' },
    { at: 0.85, k: 'The result', h: 'Be <span class="ai">AI</span>-Ready.', p: 'Less busywork, more room to grow your business.', cta: true }
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
        '</div>';
    }).join('');
    sec.innerHTML = '<div class="scrolly-pin"><div class="scrolly-grid">' +
      '<div class="scrolly-copy">' + caps +
      '<button type="button" class="btn btn-primary hq-open">Let\'s get you AI Ready!</button></div>' +
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
    var pinEl = sec.querySelector('.scrolly-pin');
    function fitCopy() {
      // narrow screens: the pinned area is only as tall as the video plus the tallest message,
      // so there's no empty space under it when the video ends
      if (full || reduce) return;
      var copy = sec.querySelector('.scrolly-copy'), tallest = 0;
      copy.style.minHeight = '0';
      [].forEach.call(capEls, function (c) { tallest = Math.max(tallest, c.offsetHeight); });
      var btn = copy.querySelector('.hq-open');
      copy.style.minHeight = (tallest + (btn ? btn.offsetHeight + 20 : 0)) + 'px';
    }
    fitCopy();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitCopy);
    window.addEventListener('load', fitCopy);
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
      var total = sec.offsetHeight - pinEl.offsetHeight;
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

    // Mouse wheel / trackpad: three scrolls play the whole video. Each scroll gesture glides
    // the video to the next stop (1/3, 2/3, end) and shows that stop's message; extra wheel
    // events from the same flick are ignored. After the end, the next scroll moves on to the page.
    var STOPS = [0, 1 / 3, 2 / 3, 1];
    var busy = false, lastWheel = 0, lastAbs = 0, lastStep = 0;
    function range() {
      var top = sec.getBoundingClientRect().top + window.scrollY - 68;
      return [top, top + sec.offsetHeight - pinEl.offsetHeight];
    }
    function glide(from, to) {
      busy = true;
      var t0 = performance.now(), dur = 650;
      (function step(now) {
        var t = Math.min(1, (now - t0) / dur);
        var e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease in-out
        window.scrollTo({ top: from + (to - from) * e, behavior: 'instant' });
        if (t < 1) requestAnimationFrame(step); else busy = false;
      })(t0);
    }
    sec.querySelector('.scrolly-pin').addEventListener('wheel', function (e) {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaY) return;
      var now = performance.now(), abs = Math.abs(e.deltaY);
      // A new scroll is either a pause in wheel events, or (on trackpads, whose flicks keep
      // "coasting" for a second or more) a sudden jump in speed while the coast is fading.
      var fresh = now - lastWheel > 180 || (abs > lastAbs * 1.6 + 4 && now - lastStep > 450);
      lastWheel = now; lastAbs = abs;
      var down = e.deltaY > 0, r = range(), y = window.scrollY, span = Math.max(1, r[1] - r[0]);
      if (y < r[0] - 2 || y > r[1] + 2) return; // not on the video
      if (busy || !fresh) { e.preventDefault(); return; } // still the same flick, or still gliding
      var p = (y - r[0]) / span, target = null;
      if (down) { for (var i = 0; i < STOPS.length; i++) if (STOPS[i] > p + 0.02) { target = STOPS[i]; break; } }
      else { for (var j = STOPS.length - 1; j >= 0; j--) if (STOPS[j] < p - 0.02) { target = STOPS[j]; break; } }
      if (target === null) return; // at an end: a new scroll moves on to the page
      e.preventDefault();
      lastStep = now;
      glide(y, r[0] + target * span);
    }, { passive: false });
    // Phones and tablets: one swipe moves the video to the next stop, so three swipes finish it
    var pin = sec.querySelector('.scrolly-pin'), ty = null, tLock = false;
    function nextStop(down) {
      var r = range(), y = window.scrollY, span = Math.max(1, r[1] - r[0]);
      if (y < r[0] - 2 || y > r[1] + 2) return null;
      var p = (y - r[0]) / span;
      if (down) { for (var i = 0; i < STOPS.length; i++) if (STOPS[i] > p + 0.02) return r[0] + STOPS[i] * span; }
      else { for (var j = STOPS.length - 1; j >= 0; j--) if (STOPS[j] < p - 0.02) return r[0] + STOPS[j] * span; }
      return null;
    }
    pin.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || (e.target.closest && e.target.closest('button,a,input,textarea,label'))) { ty = null; return; }
      ty = e.touches[0].clientY; tLock = false;
    }, { passive: true });
    pin.addEventListener('touchmove', function (e) {
      if (ty === null) return;
      var dy = ty - e.touches[0].clientY;
      if (!tLock && Math.abs(dy) < 6) return;
      if (busy || nextStop(dy > 0) !== null) { tLock = true; e.preventDefault(); } // stay on the video; the swipe picks the next stop
    }, { passive: false });
    pin.addEventListener('touchend', function (e) {
      if (ty === null || !tLock) { ty = null; return; }
      var dy = ty - e.changedTouches[0].clientY; ty = null;
      if (busy || Math.abs(dy) < 30) return;
      var to = nextStop(dy > 0);
      if (to !== null) glide(window.scrollY, to);
    }, { passive: true });
    window.addEventListener('resize', function () { sizeCanvas(); fitCopy(); current = -1; onScroll(); });
    update();
  }

  // ---------- "What do you need?" form (opens from the button under the video) ----------
  var SERVICES = ['AI strategy & consulting', 'AI receptionist / voice & text AI', 'Website design', 'Automation & AI agents',
    'AI marketing', 'AI training for teams', 'AI classes for kids', 'Creative studio (videos & content)', 'Not sure yet'];
  var NEEDS = {
    'AI strategy & consulting': ['Find where AI fits my business', 'Build a step-by-step AI plan', 'Choose the right AI tools'],
    'AI receptionist / voice & text AI': ['Answer calls after hours', 'Text back missed calls', 'Book appointments automatically'],
    'Website design': ['A new website', 'Redesign my current website', 'Online booking or payments'],
    'Automation & AI agents': ['Automate follow-ups', 'Cut data entry and paperwork', 'Connect the apps I use'],
    'AI marketing': ['Get more reviews', 'Social media content', 'Email campaigns to find clients'],
    'AI training for teams': ['Train my team on ChatGPT or Copilot', 'A workshop for managers'],
    'AI classes for kids': ['After-school program', 'Classes at my school', 'Library or community center program'],
    'Creative studio (videos & content)': ['Promo or ad videos', 'Content for social media', 'Brand visuals'],
    'Not sure yet': ['Save time on busywork', 'Get more clients', 'Learn what AI can do for me']
  };
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function buildForm() {
    var f = document.createElement('form');
    f.className = 'hq'; f.noValidate = true; f.setAttribute('aria-label', 'Tell us what you need');
    f.innerHTML =
      '<div class="hq-step on" data-s="1"><p class="hq-q" id="hq-q1">Which service are you looking for?</p>' +
      '<div class="hq-chips" role="group" aria-labelledby="hq-q1">' + SERVICES.map(function (s, i) {
        return '<label><input type="checkbox" name="service" value="' + esc(s) + '">' + esc(s) + '</label>'; }).join('') + '</div>' +
      '<div class="hq-nav"><button type="button" class="btn btn-primary hq-next">Next</button></div></div>' +
      '<div class="hq-step" data-s="2"><p class="hq-q" id="hq-q2">What would you like help with?</p>' +
      '<div class="hq-chips hq-needs" role="group" aria-labelledby="hq-q2"></div>' +
      '<label class="hq-l" for="hq-need">Anything else? <span>(optional)</span></label>' +
      '<textarea id="hq-need" name="need" rows="2" placeholder="Tell us a little more"></textarea>' +
      '<label class="hq-l" for="hq-biz">Business or school name <span>(optional)</span></label><input id="hq-biz" name="business" autocomplete="organization">' +
      '<div class="hq-nav"><button type="button" class="hq-back">Back</button><button type="button" class="btn btn-primary hq-next">Next</button></div></div>' +
      '<div class="hq-step" data-s="3"><p class="hq-q">Where can we reach you?</p>' +
      '<label class="hq-l" for="hq-name">Your name</label><input id="hq-name" name="name" autocomplete="name" required>' +
      '<label class="hq-l" for="hq-email">Email</label><input id="hq-email" name="email" type="email" autocomplete="email" required>' +
      '<label class="hq-l" for="hq-phone">Phone</label><input id="hq-phone" name="phone" type="tel" autocomplete="tel" required>' +
      '<input type="text" name="_honey" class="hq-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="hq-nav"><button type="button" class="hq-back">Back</button><button type="submit" class="btn btn-primary hq-send">Send</button></div></div>' +
      '<p class="hq-msg" role="status" aria-live="polite"></p>' +
      '<p class="hq-step-n" aria-hidden="true">Step <b>1</b> of 3</p>';
    var step = 1, msg = f.querySelector('.hq-msg');
    function show(n) {
      step = n;
      [].forEach.call(f.querySelectorAll('.hq-step'), function (el) { el.classList.toggle('on', +el.dataset.s === n); });
      f.querySelector('.hq-step-n b').textContent = n;
      msg.textContent = ''; msg.className = 'hq-msg';
      var first = f.querySelector('.hq-step.on input:not(.hq-hp)');
      if (n > 1 && first) first.focus({ preventScroll: true });
    }
    function needs() { return [].map.call(f.querySelectorAll('input[name=needopt]:checked'), function (i) { return i.value; }); }
    function fillNeeds() {
      // options for the services they picked, keeping any boxes already ticked
      var keep = needs(), seen = {}, html = '';
      picked().forEach(function (svc) {
        (NEEDS[svc] || []).forEach(function (o) {
          if (seen[o]) return; seen[o] = 1;
          html += '<label><input type="checkbox" name="needopt" value="' + esc(o) + '"' + (keep.indexOf(o) > -1 ? ' checked' : '') + '>' + esc(o) + '</label>';
        });
      });
      f.querySelector('.hq-needs').innerHTML = html;
    }
    function err(t) { msg.className = 'hq-msg err'; msg.textContent = t; }
    function picked() { return [].map.call(f.querySelectorAll('input[name=service]:checked'), function (i) { return i.value; }); }
    f.addEventListener('change', function () { f.dataset.started = '1'; });
    f.addEventListener('input', function () { f.dataset.started = '1'; });
    f.addEventListener('click', function (e) {
      if (e.target.closest('.hq-next')) {
        if (step === 1 && !picked().length) return err('Please pick at least one service.');
        if (step === 1) fillNeeds();
        if (step === 2 && !needs().length && !(f.elements.need.value || '').trim()) return err('Please pick at least one, or tell us in the box.');
        show(step + 1);
      } else if (e.target.closest('.hq-back')) show(step - 1);
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (step < 3) { f.querySelector('.hq-step.on .hq-next').click(); return; }
      var v = function (n) { return (f.elements[n].value || '').trim(); };
      if (!v('name') || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('email'))) return err('Please add your name and a valid email so we can reply.');
      if (v('phone').replace(/\D/g, '').length < 7) return err('Please add your phone number.');
      if (v('_honey')) return;
      var btn = f.querySelector('.hq-send'), services = picked().join(', ');
      btn.disabled = true; btn.textContent = 'Sending…'; msg.textContent = '';
      fetch('https://formsubmit.co/ajax/beaireadyco@gmail.com', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: 'Home page inquiry from ' + v('name') + ': ' + services, _template: 'table',
          services: services, need: needs().join(', ') || '(none ticked)', more: v('need'), business: v('business'), name: v('name'),
          email: v('email'), phone: v('phone'), page: 'Home page' })
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.success === 'false' || j.success === false) throw 0; }); })
        .then(function () {
          f.innerHTML = '<p class="hq-done"><b>Thank you!</b> We got your answers and will be in touch soon.</p>';
        })
        .catch(function () { err("That didn't send. Please email BeAIReadyCo@gmail.com or try again."); })
        .finally(function () { if (btn.isConnected) { btn.disabled = false; btn.textContent = 'Send'; } });
    });
    return f;
  }

  function addFormWindow(sec) {
    // the "Let's get you AI Ready!" button under the last message opens the 3-question form in a window
    var dlg = document.createElement('dialog');
    dlg.className = 'hq-dlg'; dlg.setAttribute('aria-labelledby', 'hq-title');
    dlg.innerHTML = '<div class="hq-dlg-head"><h2 id="hq-title">Tell us what you need</h2>' +
      '<button type="button" class="hq-x" aria-label="Close">&times;</button></div>';
    dlg.appendChild(buildForm());
    sec.appendChild(dlg);
    [].forEach.call(sec.querySelectorAll('.hq-open'), function (btn) {
      btn.addEventListener('click', function () {
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
        var first = dlg.querySelector('.hq-step.on input'); if (first) first.focus();
      });
    });
    dlg.querySelector('.hq-x').addEventListener('click', function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg && dlg.close) dlg.close(); }); // click outside closes
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
    if (content) {
      var ctas = content.querySelector('.ctas');
      if (ctas) ctas.remove(); // no buttons on the video; the consultation button lives under it
      sec.querySelector('.scrolly-hero').appendChild(content);
    }
    hero.parentNode.insertBefore(sec, hero);
    hero.hidden = true;
    addFormWindow(sec);
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
