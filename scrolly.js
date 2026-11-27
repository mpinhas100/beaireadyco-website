/* "From chaos to calm": the opening of the home page. The desk-cleanup video plays by itself
   at normal speed, with captions that follow it. Video: /scrolly/desk.mp4 (phones: desk-m.mp4). */
(function () {
  var DIR = '/scrolly/desk/';
  var BOOK = 'https://calendly.com/mpinhas100/30min';
  var CAPS = [
    { at: 0.00, hero: true },
    { at: 0.20, k: 'A normal day', h: 'Sound familiar?', p: 'Phones ringing. Notes everywhere. An inbox that never ends.' },
    { at: 0.50, k: 'Our Solution:', h: 'AI picks up the busywork.', p: 'Calls answered and follow-ups sent.<br>Emails sorted and answered.<br>Admin and scheduling handled in the background.' },
    { at: 0.85, k: 'The result', h: 'Be <span class="ai">AI</span>-Ready.', p: 'Less busywork, more room to grow your business.', cta: true }
  ];
  var PHONE = window.innerWidth <= 820;
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}


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
      '<div class="scrolly-stage"><video muted playsinline preload="auto" poster="' + DIR + (PHONE ? 'm-' : 'd-') + '001.webp" ' +
      'aria-label="A cluttered office desk is tidied up by a small glowing AI helper until it is calm and organized.">' +
      '<source src="/scrolly/' + (PHONE ? 'desk-m.mp4' : 'desk.mp4') + '" type="video/mp4"></video>' +
      '<div class="scrolly-bar" aria-hidden="true"><i></i></div></div>' +
      '</div></div>';
    return sec;
  }

  function wire(sec) {
    // The video plays by itself at normal speed (no scroll control). The welcome message shows
    // first, then the video plays once and the messages follow it; it stops on the calm desk.
    var small = window.innerWidth <= 820;
    var full = !small && !reduce; // computers: full-screen, cropped to cover
    var video = sec.querySelector('video');
    var capEls = sec.querySelectorAll('.scrolly-cap');
    var bar = sec.querySelector('.scrolly-bar i');
    var copy = sec.querySelector('.scrolly-copy');
    var HOLD = 2500; // ms the welcome message stays before the video starts
    function fitCopy() {
      // narrow screens: room for the tallest message, so the button doesn't jump
      if (full) return;
      var tallest = 0;
      copy.style.minHeight = '0';
      [].forEach.call(capEls, function (c) { tallest = Math.max(tallest, c.offsetHeight); });
      var btn = copy.querySelector('.hq-open');
      copy.style.minHeight = (tallest + (btn ? btn.offsetHeight + 20 : 0)) + 'px';
    }
    fitCopy();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitCopy);
    window.addEventListener('load', fitCopy);
    window.addEventListener('resize', fitCopy);
    var capIndex = 0;
    function setCap(ci) {
      if (ci === capIndex) return;
      capEls[capIndex].classList.remove('on');
      capEls[ci].classList.add('on');
      capIndex = ci;
    }
    function update() {
      var d = video.duration || 8, p = Math.min(1, video.currentTime / d);
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if (!started) return;
      var ci = 1;
      for (var i = 1; i < CAPS.length; i++) if (p >= CAPS[i].at) ci = i;
      setCap(ci);
    }
    var started = false, ticking = false;
    function loop() { update(); if (!video.paused && !video.ended) requestAnimationFrame(loop); else ticking = false; }
    video.addEventListener('play', function () { if (!ticking) { ticking = true; requestAnimationFrame(loop); } });
    video.addEventListener('ended', function () { setCap(CAPS.length - 1); bar.style.transform = 'scaleX(1)'; });
    if (reduce) {
      // reduce motion: no playback; show the calm desk with the welcome message
      video.removeAttribute('autoplay');
      video.addEventListener('loadedmetadata', function () { try { video.currentTime = video.duration - 0.05; } catch (e) {} });
      return;
    }
    function start() {
      setTimeout(function () {
        started = true; setCap(1);
        var pr = video.play();
        if (pr && pr.catch) pr.catch(function () { started = false; setCap(0); }); // autoplay blocked: keep the welcome
      }, HOLD);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); start(); } }, { threshold: 0.4 });
      io.observe(sec);
    } else start();
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
    // the button at the bottom of the page opens the same form (its booking link stays as a fallback)
    var closer = document.querySelector('#app .closer .btn-primary');
    if (closer) closer.classList.add('hq-open');
    if (!window.__hqOpen) {
      window.__hqOpen = true;
      document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.hq-open');
        var d = document.querySelector('.hq-dlg');
        if (!btn || !d) return;
        e.preventDefault();
        if (d.showModal) d.showModal(); else d.setAttribute('open', '');
        var first = d.querySelector('.hq-step.on input'); if (first) first.focus();
      });
    }
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
