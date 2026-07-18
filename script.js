(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('[data-site-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const siteNav = document.querySelector('[data-site-nav]');

  document.querySelectorAll('[data-current-year]').forEach((year) => {
    year.textContent = String(new Date().getFullYear());
  });

  const closeMenu = (returnFocus = false) => {
    if (!menuToggle || !siteNav) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    siteNav.removeAttribute('data-open');
    if (returnFocus) menuToggle.focus();
  };

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const willOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(willOpen));
      menuToggle.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
      if (willOpen) siteNav.setAttribute('data-open', 'true');
      else siteNav.removeAttribute('data-open');
    });

    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu(true);
      }
    });

    window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
      if (event.matches) closeMenu();
    });
  }

  const moment = document.querySelector('[data-moment]');
  if (moment) {
    const steps = [...moment.querySelectorAll('[data-moment-step]')];
    const screens = moment.querySelector('[data-moment-screens]');
    const count = moment.querySelector('[data-moment-count]');
    const label = moment.querySelector('[data-moment-label]');

    const setMoment = (index) => {
      const step = steps[index];
      if (!step) return;

      if (screens) screens.dataset.active = String(index);
      if (count) count.textContent = String(index + 1).padStart(2, '0');
      if (label) label.textContent = step.querySelector('strong')?.textContent || '';

      steps.forEach((item, itemIndex) => {
        const active = itemIndex === index;
        item.classList.toggle('is-active', active);
        item.querySelector('button')?.setAttribute('aria-pressed', String(active));
      });
    };

    steps.forEach((step, index) => {
      step.querySelector('button')?.addEventListener('click', () => setMoment(index));
    });

    if (!reduceMotion.matches && 'IntersectionObserver' in window) {
      const momentObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible) setMoment(Number(visible.target.dataset.momentStep));
        },
        { threshold: [0.45, 0.65], rootMargin: '-18% 0px -38%' }
      );
      steps.forEach((step) => momentObserver.observe(step));
    }
  }

  root.classList.add('js-ready');

  const revealTargets = [...document.querySelectorAll('.reveal')];
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    revealTargets.forEach((target) => target.classList.add('will-reveal'));

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8%' }
    );

    revealTargets.forEach((target) => revealObserver.observe(target));
    window.setTimeout(() => {
      revealTargets.forEach((target) => target.classList.add('is-visible'));
    }, 1800);
  }

  if (header) {
    const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 16);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }
})();
