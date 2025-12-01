// scrollspy-fix.js - append to menu-anim or global.js (defer/DOMContentLoaded ensured)
(function(){
  function $(s, ctx){ return (ctx||document).querySelector(s); }
  function $$(s, ctx){ return Array.from((ctx||document).querySelectorAll(s)); }

  function normalizeHeadingVisibility(section){
    // Force headings visible if hidden by inline styles or aria-hidden
    ['.heading-h2', '.heading-h2-italic'].forEach(sel => {
      const h = section.querySelector(sel);
      if (h) {
        // If empty node, try to recover from data-title or id name (fallback)
        if ((h.textContent || '').trim().length === 0) {
          // try data-title attribute on section
          const dt = section.getAttribute('data-title') || section.id || '';
          if (dt) h.textContent = dt.replace(/[-_]/g,' ');
        }
        // Remove possible inline hiding
        h.style.display = 'block';
        h.style.opacity = '1';
        h.style.visibility = 'visible';
        h.removeAttribute('aria-hidden');
      }
    });

    // Remove accidental empty element placeholders that cause spacing
    Array.from(section.querySelectorAll('*')).forEach(el => {
      if ((el.textContent||'').trim().length===0 && el.clientHeight>0 && el.classList.contains('empty-placeholder')){
        el.classList.add('empty-fix');
      }
    });
  }

  function initScrollspyAndHeadings(){
    const navLinks = $$('.menu-nav .menu-nav-link');
    const sections = $$('.menu_items-wrapper[id]');

    if (!navLinks.length || !sections.length) {
      console.warn('scrollspy-fix: no navLinks or sections found.');
      return;
    }

    // Mark first link active by default
    const firstLink = navLinks[0];
    if (firstLink) {
      firstLink.classList.add('w--current','active');
    }

    // Ensure headings visible initially
    sections.forEach(s => normalizeHeadingVisibility(s));

    // IntersectionObserver to update active link
    const obs = new IntersectionObserver((entries) => {
      // We'll collect visible sections and choose the one with largest intersectionRatio
      const visible = entries.filter(e=>e.isIntersecting);
      if (visible.length>0) {
        // pick the entry with highest ratio
        visible.sort((a,b)=>b.intersectionRatio - a.intersectionRatio);
        const topEntry = visible[0];
        const id = topEntry.target.id;
        // update nav links
        navLinks.forEach(link=>{
          const href = (link.getAttribute('href')||'').split('#').pop();
          if (href === id) link.classList.add('w--current','active');
          else link.classList.remove('w--current','active');
        });
      } else {
        // none intersecting -> pick the section whose top is nearest to viewport top
        let nearest = null;
        let nearestDist = Infinity;
        sections.forEach(sec=>{
          const rect = sec.getBoundingClientRect();
          // consider only sections below the top (you can change absolute value)
          const dist = Math.abs(rect.top);
          if (dist < nearestDist) { nearestDist = dist; nearest = sec; }
        });
        if (nearest) {
          const id = nearest.id;
          navLinks.forEach(link=>{
            const href = (link.getAttribute('href')||'').split('#').pop();
            if (href === id) link.classList.add('w--current','active');
            else link.classList.remove('w--current','active');
          });
        }
      }
    }, {
      threshold: [0.15, 0.35, 0.6],
      rootMargin: '-10% 0px -40% 0px'
    });

    // observe sections
    sections.forEach(s => obs.observe(s));

    // Re-normalize headings on resize (sometimes Webflow injects)
    window.addEventListener('resize', () => {
      sections.forEach(s => normalizeHeadingVisibility(s));
    });

    // Also re-run after a short delay for dynamic content
    setTimeout(()=> sections.forEach(s=>normalizeHeadingVisibility(s)), 600);

    console.log('scrollspy-fix: initialized', navLinks.length, 'links and', sections.length, 'sections');
  }

  if (document.readyState !== 'loading') initScrollspyAndHeadings();
  else document.addEventListener('DOMContentLoaded', initScrollspyAndHeadings);
})();




// menu-anim.js
// Añádelo con defer o justo antes de </body>
// Controla reveals de .menu-item y scrollspy para .menu-nav-link

(function () {
  // Helper
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function initMenuAnimations() {
    const items = $$('.menu-item');
    const sections = $$('.menu_items-wrapper[id]'); // secciones con id
    const navLinks = $$('.menu-nav .menu-nav-link');

    // --------------- Clean inline opacity to avoid conflicts ---------------
    items.forEach(it => {
      // guarda inline transform/opacity si quieres revertir más tarde:
      if (it.hasAttribute('style')) {
        it.dataset._inlineStyle = it.getAttribute('style');
      }
      // Force hidden initial state (CSS already forces, but esto elimina valores inline)
      it.style.opacity = '';
      it.style.transform = '';
      // ensure not visible until in-view
      it.classList.remove('in-view');
    });

    // ---------------- Reveal observer (menu items) ----------------
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.classList.add('in-view');
        } else {
          // si quieres que no se reprograme al hacer scroll up, comenta la siguiente línea
          el.classList.remove('in-view');
        }
      });
    }, {
      threshold: 0.08,              // cuando ~8% visible
      rootMargin: '0px 0px -10% 0px' // dispara un poco antes
    });

    items.forEach(i => revealObserver.observe(i));

    // ---------------- Scrollspy observer (secciones) ----------------
    // Observamos las secciones grandes (menu_items-wrapper) para actualizar el nav
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const sec = entry.target;
        const id = sec.id;
        const isActive = entry.isIntersecting && entry.intersectionRatio > 0.35;
        // toggle an is-active class on section (for heading color)
        sec.classList.toggle('is-active', isActive);

        // Find nav link that points to this id
        navLinks.forEach(link => {
          // href may be './carta.html#Comidas' or '#Comidas' - we match by ending hash
          const href = link.getAttribute('href') || '';
          // normalize: look for '#id' substring
          const matchHash = href.split('#').pop();
          if (matchHash === id) {
            if (isActive) {
              link.classList.add('w--current', 'active');
            } else {
              link.classList.remove('w--current', 'active');
            }
          }
        });
      });
    }, {
      threshold: [0.15, 0.35, 0.6], // varios umbrales para mayor estabilidad
      rootMargin: '-10% 0px -40% 0px'
    });

    sections.forEach(s => sectionObserver.observe(s));

    // -------------- Smooth behaviour for internal links (optional) --------------
    navLinks.forEach(link => {
      // intercept internal hash navigation so scroll leads to reveal triggering reliably
      const href = link.getAttribute('href') || '';
      if (href.indexOf('#') !== -1) {
        link.addEventListener('click', function (e) {
          const hash = href.split('#').pop();
          const target = document.getElementById(hash);
          if (target) {
            e.preventDefault();
            // smooth scroll + small offset for header if needed
            const y = target.getBoundingClientRect().top + window.scrollY - 40;
            window.scrollTo({ top: y, behavior: 'smooth' });
            // set active immediately for UX
            navLinks.forEach(l => l.classList.remove('w--current','active'));
            this.classList.add('w--current','active');
          }
        });
      }
    });

    console.log('menu-anim: initted', items.length, 'items and', sections.length, 'sections.');
  }

  // Init after DOM loaded
  if (document.readyState !== 'loading') initMenuAnimations();
  else document.addEventListener('DOMContentLoaded', initMenuAnimations);
})();
