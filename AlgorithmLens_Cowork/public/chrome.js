// Shared header: 72 px on the paper ground at rest, 64 px on translucent paper
// once the page has scrolled. Reduced motion keeps the ground opaque (CSS).
(function () {
  'use strict';
  var topbar = document.getElementById('topbar');
  if (!topbar) return;
  var scrolled = null;
  function check() {
    var now = window.scrollY > 8;
    if (now !== scrolled) { scrolled = now; topbar.classList.toggle('scrolled', now); }
  }
  window.addEventListener('scroll', check, { passive: true });
  check();
})();

// The header menu (below 900 px) is a native disclosure, so it opens without
// script. Script only closes it: when a link inside it is followed, on
// Escape, and when a click lands outside it.
(function () {
  'use strict';
  var menu = document.getElementById('menu');
  if (!menu) return;
  menu.addEventListener('click', function (e) { if (e.target.closest('nav a')) menu.open = false; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  document.addEventListener('click', function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
})();

// Document pages (/methodology, /terms): the contents link for the section
// being read is marked as the current location. The section is the last one
// whose heading has reached the top of the window. /privacy/ is served under
// a policy that allows no script, so its contents list stays unmarked.
(function () {
  'use strict';
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (!links.length) return;
  var heads = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var current = -1, queued = false;
  function mark() {
    queued = false;
    var now = -1;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i] && heads[i].getBoundingClientRect().top <= 140) now = i;
    }
    if (now === current) return;
    if (current >= 0) links[current].removeAttribute('aria-current');
    if (now >= 0) links[now].setAttribute('aria-current', 'location');
    current = now;
  }
  window.addEventListener('scroll', function () {
    if (!queued) { queued = true; window.requestAnimationFrame(mark); }
  }, { passive: true });
  mark();
})();
