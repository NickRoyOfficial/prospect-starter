const initialized = new WeakSet();
const observed = new WeakSet();
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const behavior = () => reducedMotion() ? 'instant' : 'smooth';

export function initUI(root = document) {
  if (!initialized.has(root)) {
    initialized.add(root);
    root.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('[data-toggle], [data-dialog-open], [data-dialog-close], [data-gallery-prev], [data-gallery-next]');
      if (!button || !root.contains(button)) return;
      event.preventDefault();
      if (button.hasAttribute('data-toggle')) {
        const panel = document.getElementById(button.dataset.toggle);
        if (!panel) return;
        const open = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-controls', panel.id);
        button.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
      }
      if (button.hasAttribute('data-dialog-open')) {
        const dialog = document.getElementById(button.dataset.dialogOpen);
        if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
      }
      if (button.hasAttribute('data-dialog-close')) button.closest('dialog')?.close();
      if (button.hasAttribute('data-gallery-prev') || button.hasAttribute('data-gallery-next')) {
        const next = button.hasAttribute('data-gallery-next');
        const gallery = document.getElementById(next ? button.dataset.galleryNext : button.dataset.galleryPrev);
        if (!gallery?.hasAttribute('data-gallery')) return;
        const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
        const amount = (gallery.firstElementChild?.getBoundingClientRect().width || gallery.clientWidth) + gap;
        gallery.scrollBy({ left: (next ? 1 : -1) * amount, behavior: behavior() });
      }
    });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const active = [...root.querySelectorAll('[data-toggle][aria-expanded="true"]')];
        const focused = active.find(button => document.getElementById(button.dataset.toggle)?.contains(document.activeElement));
        for (const button of active) {
          const panel = document.getElementById(button.dataset.toggle);
          if (panel) panel.hidden = true;
          button.setAttribute('aria-expanded', 'false');
        }
        focused?.focus();
      }
      if (event.target.matches('[data-gallery]') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        event.target.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * event.target.clientWidth * .8, behavior: behavior() });
      }
    });
  }
  for (const button of root.querySelectorAll('[data-toggle]')) {
    const panel = document.getElementById(button.dataset.toggle);
    if (panel) {
      button.setAttribute('aria-controls', panel.id);
      button.setAttribute('aria-expanded', String(!panel.hidden));
    }
  }
  for (const gallery of root.querySelectorAll('[data-gallery]')) {
    if (observed.has(gallery)) continue;
    observed.add(gallery);
    if (!gallery.hasAttribute('tabindex')) gallery.tabIndex = 0;
    const buttons = [...root.querySelectorAll('[data-gallery-prev], [data-gallery-next]')].filter(button => button.dataset.galleryPrev === gallery.id || button.dataset.galleryNext === gallery.id);
    const update = () => {
      const max = gallery.scrollWidth - gallery.clientWidth;
      for (const button of buttons) button.disabled = button.hasAttribute('data-gallery-prev') ? gallery.scrollLeft <= 2 : gallery.scrollLeft >= max - 2;
    };
    let frame = 0;
    gallery.addEventListener('scroll', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(gallery);
    else window.addEventListener('resize', update);
    gallery.addEventListener('load', update, true);
    update();
  }
  for (const dialog of root.querySelectorAll('dialog[data-dialog]')) {
    if (observed.has(dialog)) continue;
    observed.add(dialog);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  }
  const targets = [...root.querySelectorAll('[data-reveal]')].filter(el => !observed.has(el));
  if (!targets.length || reducedMotion() || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('reveal-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .1 });
  for (const el of targets) { observed.add(el); el.classList.add('reveal-pending'); observer.observe(el); }
}
