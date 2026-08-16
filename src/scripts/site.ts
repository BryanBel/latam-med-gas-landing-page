// All client interactions, re-run on every navigation via `astro:page-load` (which also
// fires on the initial load, so View Transitions and a plain first paint both work). Global
// listeners (scroll/keydown) are bound once at module scope; per-page setup is idempotent
// via guard attributes so a re-run never double-binds.

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)');
  if (!els.length) return;
  if (reduced() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries, obs) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        if (el.dataset.revealDelay) el.style.transitionDelay = `${el.dataset.revealDelay}ms`;
        el.classList.add('is-visible');
        obs.unobserve(el);
      }),
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

function initCounters(): void {
  const nums = document.querySelectorAll<HTMLElement>('[data-count-to]:not([data-counted])');
  if (!nums.length) return;
  if (reduced() || !('IntersectionObserver' in window)) {
    nums.forEach((el) => {
      el.textContent = el.dataset.countTo || '0';
      el.dataset.counted = '1';
    });
    return;
  }
  const run = (el: HTMLElement) => {
    el.dataset.counted = '1';
    const target = Number(el.dataset.countTo || '0');
    const dur = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = String(target);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(
    (entries, obs) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        run(e.target as HTMLElement);
        obs.unobserve(e.target);
      }),
    { threshold: 0.4 },
  );
  nums.forEach((el) => io.observe(el));
}

function initTilt(): void {
  // No media-query gate: hybrid/touchscreen Windows laptops misreport `pointer`/`hover`, which
  // was disabling the effect even with a mouse. Bind always and just ignore touch per-event —
  // a real mouse fires pointerType "mouse"/"pen", a finger fires "touch".
  if (reduced()) return;
  document.querySelectorAll<HTMLElement>('[data-tilt]:not([data-tilt-bound])').forEach((el) => {
    el.dataset.tiltBound = '1';
    el.style.willChange = 'transform';
    const max = 10;
    el.addEventListener('pointermove', (ev) => {
      if (ev.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      const rx = (((ev.clientY - r.top) / r.height - 0.5) * -2 * max).toFixed(2);
      const ry = (((ev.clientX - r.left) / r.width - 0.5) * 2 * max).toFixed(2);
      el.style.transition = 'transform 60ms ease-out';
      el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform 350ms ease';
      el.style.transform = '';
    });
  });
}

function initMobileNav(): void {
  const button = document.getElementById('mobile-nav-button');
  const nav = document.getElementById('mobile-nav');
  if (!button || !nav || button.dataset.bound) return;
  button.dataset.bound = '1';
  const setOpen = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('hidden', !open);
    nav.classList.toggle('flex', open);
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach((l) => l.addEventListener('click', () => setOpen(false)));
}

function initPage(): void {
  initReveal();
  initCounters();
  initTilt();
  initMobileNav();
}

// Global, bound once — they read the current DOM each time so they survive page swaps.
const updateProgress = () => {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const el = document.documentElement;
  const max = el.scrollHeight - el.clientHeight;
  bar.style.setProperty('--progress', String(max > 0 ? el.scrollTop / max : 0));
};

addEventListener('scroll', updateProgress, { passive: true });
addEventListener('resize', updateProgress, { passive: true });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const button = document.getElementById('mobile-nav-button');
  if (button?.getAttribute('aria-expanded') === 'true') {
    button.setAttribute('aria-expanded', 'false');
    document.getElementById('mobile-nav')?.classList.add('hidden');
    document.getElementById('mobile-nav')?.classList.remove('flex');
    button.focus();
  }
});

function boot(): void {
  initPage();
  updateProgress();
}

// Run for the initial paint regardless of event timing, then again on every navigation.
if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
document.addEventListener('astro:page-load', boot);
