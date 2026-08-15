// Scroll-reveal: fades and lifts elements tagged [data-reveal] as they enter the viewport.
// Progressive enhancement — the `.js` class (set inline in the <head>) is what arms the
// hidden start state in CSS, so no-JS visitors always see content. Reduced-motion visitors
// are revealed immediately with no transition.
function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!els.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        if (el.dataset.revealDelay) el.style.transitionDelay = `${el.dataset.revealDelay}ms`;
        el.classList.add('is-visible');
        obs.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

if (document.readyState !== 'loading') initReveal();
else document.addEventListener('DOMContentLoaded', initReveal);
