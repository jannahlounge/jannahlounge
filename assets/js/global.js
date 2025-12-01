/* global.js - Hover-only behavior with debug and mobile fallback
   ADJUST: Si tus selectores son distintos reemplaza '.navbar-dropdown-wrapper' y '.navbar-dropdown'
*/

(function () {
  // util
  function $$(sel, ctx) { return Array.from((ctx||document).querySelectorAll(sel)); }
  function $(sel, ctx) { return (ctx||document).querySelector(sel); }

  const wrappers = $$('.navbar-dropdown-wrapper');

  // Nothing to do
  if (!wrappers.length) {
    console.warn('global.js: no .navbar-dropdown-wrapper found. Check selector or HTML.');
    return;
  }

  // Debug helper: attach a small visual marker when event fires (optional)
  function debugMark(el, label) {
    if (!window.__menuDebug) return;
    el.style.outline = '1px dashed rgba(0,255,0,0.35)';
    console.log('menu debug:', label, el);
    setTimeout(()=>{ el.style.outline = ''; }, 800);
  }

  // Ensure dropdowns are visible for measurement (some themes hide display:none)
  wrappers.forEach(wrapper => {
    const dropdown = wrapper.querySelector('.navbar-dropdown');
    if (!dropdown) return;
    // Remove inline display:none if exists, rely on opacity/pointer-events for visibility
    if (getComputedStyle(dropdown).display === 'none') {
      dropdown.style.display = 'block';
    }
  });

  // MAIN: try pure-hover first by wiring mouseenter/mouseleave to apply a class
  wrappers.forEach(wrapper => {
    const dropdown = wrapper.querySelector('.navbar-dropdown');
    if (!dropdown) return;

    // Remove any existing click handlers on the trigger that could block hover.
    // If trigger is a <a> or <button> inside wrapper, leave it but prevent it from toggling.
    const triggers = wrapper.querySelectorAll('a, button, .navbar-dropdown-trigger, .menu-toggle');
    triggers.forEach(t => {
      // store original onclick if needed
      if (t.__savedOnClick === undefined) t.__savedOnClick = t.onclick || null;
      t.onclick = function (e) {
        // prevent toggle on click to allow hover UX on desktop
        // allow links to navigate if they have href and user actually clicks while expecting navigation
        const href = t.getAttribute && t.getAttribute('href');
        if (href && href !== '#' && href.indexOf('javascript:')===-1) {
          // allow navigate — but do not toggle menu
          return true;
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
    });

    let closeTimer;

  wrapper.addEventListener('mouseenter', () => {
    clearTimeout(closeTimer);
    wrapper.classList.add('hover-open');
  });

  wrapper.addEventListener('mouseleave', () => {
    closeTimer = setTimeout(() => {
      wrapper.classList.remove('hover-open');
    }, 150); // ADJUST: 120–200ms
  });


    // keyboard accessibility: open on focus within, close on blur out
    wrapper.addEventListener('focusin', function () {
      wrapper.classList.add('hover-open');
    });
    wrapper.addEventListener('focusout', function () {
      // small timeout to allow focusing inside child elements
      setTimeout(() => {
        if (!wrapper.contains(document.activeElement)) wrapper.classList.remove('hover-open');
      }, 10);
    });
  });

  // Click/touch fallback for devices without hover
  const hasHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!hasHover) {
    // mobile: tap once to open, tap outside to close
    document.addEventListener('click', function (e) {
      let clickedWrapper = null;
      wrappers.forEach(w => {
        if (w.contains(e.target)) clickedWrapper = w;
      });
      // Close all first
      wrappers.forEach(w => w.classList.remove('hover-open'));
      if (clickedWrapper) {
        clickedWrapper.classList.add('hover-open');
      }
    }, {passive:true});

    // Close when pressing Esc
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        wrappers.forEach(w => w.classList.remove('hover-open'));
      }
    });
  }

  // QUICK sanity debug ping: print wrappers and their dropdown presence
  console.log('global.js: initialized hover-fallback for dropdowns. Found wrappers:', wrappers.length);
  wrappers.forEach((w,i) => {
    console.log(' wrapper', i, 'has dropdown:', !!w.querySelector('.navbar-dropdown'));
  });

  // Optional: expose function to toggle debug outlines from console:
  window.__menuDebug = window.__menuDebug || false;
  window.toggleMenuDebug = function () { window.__menuDebug = !window.__menuDebug; console.log('menu debug ->', window.__menuDebug); };

})();
