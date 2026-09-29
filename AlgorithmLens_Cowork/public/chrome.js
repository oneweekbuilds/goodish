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
