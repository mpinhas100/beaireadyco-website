/* Gentle scroll reveals (motion-polish skill).
   Sections rise in as they enter the screen; cards in a row appear one after another.
   Skipped for visitors with "reduce motion" on, for pages that already animate,
   and for anything already on screen when the page opens. Nothing is hidden unless this script runs. */
(function () {
  try {
    if (!('IntersectionObserver' in window)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e) { return; }

  var DELAYS = [0, 70, 130, 180, 225, 265, 300, 330, 355, 375, 390, 400];
  var LISTISH = /grid|tiles|paths|steps|progs|flow|lpath|path|who|ways|tools|faq|svcs|cards|list/i;

  function init() {
    if (document.body.classList.contains('editing')) return;
    var main = document.querySelector('main');
    if (!main || main.querySelector('.bai-reveal')) return;
    var sections = [].filter.call(main.querySelectorAll('section'), function (s) {
      return !s.parentElement.closest('section');
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
          kids.slice(0, 24).forEach(function (k, i) { targets.push([k, DELAYS[Math.min(i, DELAYS.length - 1)]]); });
        } else {
          targets.push([child, 0]);
        }
      });
    });

    var vh = window.innerHeight;
    document.documentElement.classList.add('rv-on');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('rv-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    targets.forEach(function (t) {
      var el = t[0];
      if (el.getBoundingClientRect().top < vh) return; // already visible: leave it alone
      el.style.setProperty('--rv-d', t[1] + 'ms');
      el.classList.add('rv');
      io.observe(el);
    });
  }

  if (document.readyState === 'complete') setTimeout(init, 60);
  else window.addEventListener('load', function () { setTimeout(init, 60); });
})();
