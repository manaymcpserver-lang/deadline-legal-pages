document.documentElement.classList.add('js');

// ---------- Reveal-on-scroll with stagger ----------
// Group siblings inside common containers so each group cascades in order.
const staggerContainers = [
  '.steps',
  '.features',
  '.integrations-grid',
  '.list-demo',
  '.hero-visual',
];
for (const sel of staggerContainers) {
  document.querySelectorAll(sel).forEach((container) => {
    const kids = container.querySelectorAll(':scope > .reveal');
    kids.forEach((el, i) => el.style.setProperty('--i', String(i)));
  });
}

// Make the urgent task row observe as well, so the pulse fires when it hits the viewport.
document.querySelectorAll('.task-row.urgent').forEach((el) => el.classList.add('reveal'));

const revealTargets = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('visible'));
}

// ---------- Nav shrink + frosted bg once scrolled ----------
const nav = document.querySelector('.nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ---------- Smooth anchor scrolling ----------
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  });
});
