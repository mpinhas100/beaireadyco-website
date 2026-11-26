/* BeAIReadyCo motion layer (motion-polish skill).
   1) Icon tiles become colorful gradient tiles; when they scroll into view they pop in,
      their lines draw themselves, then they float gently with a light sweep.
   2) Sections rise in from below with a blur-to-sharp fade; cards in a row tilt up into
      place one after another.
   Visitors with "reduce motion" get the colorful tiles without any movement.
   Pages that already have their own animations (Websites, Mia, AI Marketing) are left alone.
   Nothing is hidden unless this script runs, and nothing already on screen is hidden. */
(function () {
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var canObserve = 'IntersectionObserver' in window;

  var DELAYS = [0, 110, 200, 280, 350, 410, 460, 500, 530, 555, 575, 590];
  var LISTISH = /grid|tiles|paths|steps|progs|flow|lpath|path|who|ways|tools|faq|svcs|cards|list/i;
  var TILES = '.path .ico, .tiles .ic, .card .ic, .plist .e, .glist li .b, .tl .b, .qi, div.ico';
  var SHAPES = 'path,circle,rect,line,polyline,polygon,ellipse';

  function setupTiles(main) {
    var tiles = [].filter.call(document.querySelectorAll(TILES), function (t) {
      return t.querySelector('svg') && !t.closest('header,footer,.bsc-h,.bsc-f,nav');
    });
    // colour each tile; neighbours in the same group get different colours
    var groupIndex = new Map();
    tiles.forEach(function (t) {
      var group = t.closest('ul,ol,.tiles,.paths,.grid3,.grid2,.svcs,.deliv,.progs,.ways,.who4') || t.parentElement;
      var n = groupIndex.get(group) || 0;
      groupIndex.set(group, n + 1);
      t.classList.add('ai-tile');
      t.setAttribute('data-g', String(n % 4));
      [].forEach.call(t.querySelectorAll('svg ' + SHAPES.split(',').join(',svg ')), function (s) {
        s.setAttribute('pathLength', '1');
      });
    });
    if (reduce || !canObserve || !tiles.length) return;

    document.documentElement.classList.add('ai-motion');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('ai-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.4 });
    tiles.forEach(function (t, i) {
      var host = t.closest('.rv');
      var base = host ? parseInt(host.style.getPropertyValue('--rv-d') || '0', 10) + 380 : 0;
      var inRow = (groupIndex.get(t.closest('ul,ol,.tiles,.paths,.grid3,.grid2,.svcs,.deliv,.progs,.ways,.who4') || t.parentElement) > 1);
      var own = inRow && !host ? (i % 6) * 120 : 0;
      t.style.setProperty('--d', (base + own) + 'ms');
      io.observe(t);
    });
  }

  function setupReveals(main) {
    if (reduce || !canObserve) return;
    var sections = [].filter.call(main.querySelectorAll('section'), function (s) {
      return !s.parentElement.closest('section') && !s.classList.contains('scrolly');
    });
    if (sections.length < 2) return;

    var targets = [];
    sections.slice(1).forEach(function (sec) {
      var box = sec.querySelector(':scope > .wrap, :scope > .bsc-w, :scope > [class*="container"]') || sec;
      [].forEach.call(box.children, function (child) {
        var kids = [].filter.call(child.children, function (k) { return k.offsetParent !== null || k.tagName === 'DETAILS'; });
        var disp = getComputedStyle(child).display;
        var isList = kids.length >= 3 && (LISTISH.test(child.className) || /grid|flex/.test(disp) || /^(UL|OL)$/.test(child.tagName));
        if (isList) {
          kids.slice(0, 24).forEach(function (k, i) { targets.push([k, DELAYS[Math.min(i, DELAYS.length - 1)], true]); });
        } else {
          targets.push([child, 0, false]);
        }
      });
    });

    var vh = window.innerHeight;
    document.documentElement.classList.add('rv-on');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('rv-in');
        io.unobserve(el);
        // once the entrance is over, hand the element back to its normal hover/press styles
        var wait = parseInt(el.style.getPropertyValue('--rv-d') || '0', 10) + 1250;
        setTimeout(function () { el.classList.remove('rv', 'rv-card', 'rv-in'); el.style.removeProperty('--rv-d'); }, wait);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    targets.forEach(function (t) {
      var el = t[0];
      if (el.getBoundingClientRect().top < vh) return; // already visible: leave it alone
      el.style.setProperty('--rv-d', t[1] + 'ms');
      el.classList.add('rv');
      if (t[2]) el.classList.add('rv-card');
      io.observe(el);
    });
  }

  function init() {
    if (document.body.classList.contains('editing')) return;
    var main = document.querySelector('main');
    if (!main || main.querySelector('.bai-reveal')) return;
    setupReveals(main);
    setupTiles(main);
  }

  if (document.readyState === 'complete') setTimeout(init, 60);
  else window.addEventListener('load', function () { setTimeout(init, 60); });
})();
