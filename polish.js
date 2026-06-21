/* HyPurShot — UI polish: navbar scroll state, scroll reveal, hover lift auto-apply.
   Inert if no .reveal elements exist. Respects prefers-reduced-motion. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) Navbar scrolled state (both fixed .navbar and sticky .pub-nav)
  var nav = document.querySelector('.navbar, .pub-nav');
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 10) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // 2) Auto-apply .lift-hover to review cards + directory operator cards + showcase tiles
  var liftSelectors = [
    '.review-card',
    '.op-card',
    '.operator-card',
    '.directory-card',
    '.showcase-tile',
    '.project-card'
  ];
  liftSelectors.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList.add('lift-hover');
    });
  });

  // 3) Scroll reveal (skip if reduced motion or no IntersectionObserver)
  if (reduce || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  var observe = function () {
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { io.observe(el); });
  };
  observe();

  // Re-scan after dynamic content loads (showcase reviews, directory cards)
  var rescan = function () { setTimeout(observe, 50); };
  document.addEventListener('hypurshot:rendered', rescan);
  // Fallback: rescan after 1s + 3s in case render hooks don't fire
  setTimeout(observe, 1000);
  setTimeout(observe, 3000);
})();
