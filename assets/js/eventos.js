// events.js





(function(){
  // Smooth scroll para enlaces internos
  document.addEventListener('click', function(e){
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });

  // Animaciones al hacer scroll
  const animatables = Array.from(document.querySelectorAll('.ev-animate'));
  if ('IntersectionObserver' in window && animatables.length){
    const obs = new IntersectionObserver(entries => {
      entries.forEach(ent => {
        if (ent.isIntersecting){
          ent.target.classList.add('is-visible');
          obs.unobserve(ent.target);
        }
      });
    }, { threshold:0.1, rootMargin:'0px 0px -5% 0px' });
    animatables.forEach(el=>obs.observe(el));
  } else {
    // fallback
    animatables.forEach(el=>el.classList.add('is-visible'));
  }

  // Manejo simple del formulario (sin backend aún)
  const form = document.getElementById('eventsForm');
  const success = document.getElementById('eventsFormSuccess');
  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());

      console.log('Solicitud de evento:', payload);

      // Aquí podrías:
      // - llamar a una API
      // - mandar a un formulario tipo Formspree
      // - generar un link de WhatsApp con los datos

      form.reset();
      if (success){
        success.hidden = false;
        setTimeout(()=>{ success.hidden = true; }, 5000);
      }
    });
  }

})();

const fadeImg = document.querySelector('.fade-scroll-img');
const fadeStart = 0;
const fadeEnd = 300;

window.addEventListener('scroll', () => {
  const sc = window.scrollY;
  const progress = Math.min(Math.max((sc - fadeStart) / (fadeEnd - fadeStart), 0), 1);

  if (!fadeImg) return;

  fadeImg.style.opacity = 1 - progress;
  fadeImg.style.transform = `translateY(${progress * 20}px)`;
});
