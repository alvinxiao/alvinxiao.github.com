function initialiseReveals() {
  const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (
    motion.matches ||
    typeof window.IntersectionObserver !== 'function' ||
    typeof HTMLElement.prototype.animate !== 'function'
  ) {
    return;
  }

  const pending = new Set<HTMLElement>();
  const played = new WeakSet<HTMLElement>();
  const active = new Map<HTMLElement, Animation>();
  const observer = new window.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const element = entry.target;
        if (!(element instanceof HTMLElement) || !entry.isIntersecting || played.has(element)) {
          continue;
        }
        pending.delete(element);
        played.add(element);
        observer.unobserve(element);
        if (element.contains(document.activeElement)) continue;

        const group = element.closest('[data-reveal-group]');
        const siblings = group ? [...group.querySelectorAll(':scope > [data-reveal]')] : [];
        const delay = Math.min(Math.max(siblings.indexOf(element), 0), 3) * 70;
        const animation = element.animate(
          [
            { opacity: 0.35, transform: 'translateY(16px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          {
            duration: 650,
            delay,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'backwards',
          },
        );
        active.set(element, animation);
        animation.onfinish = () => {
          active.delete(element);
          animation.cancel();
        };
      }
    },
    { threshold: 0.12 },
  );

  const settle = (element: HTMLElement) => {
    pending.delete(element);
    played.add(element);
    observer.unobserve(element);
    active.get(element)?.cancel();
    active.delete(element);
  };
  const settleRelated = (node: Node) => {
    for (const element of new Set([...pending, ...active.keys()])) {
      if (element.contains(node) || node.contains(element)) settle(element);
    }
  };
  const settleFragment = () => {
    const fragment = window.location.hash.slice(1);
    if (!fragment) return;
    let target: HTMLElement | null;
    try {
      target = document.getElementById(decodeURIComponent(fragment));
    } catch {
      return;
    }
    if (target) settleRelated(target);
  };
  const settleAll = () => {
    for (const element of new Set([...pending, ...active.keys()])) settle(element);
    observer.disconnect();
  };

  for (const element of targets) {
    const rectangle = element.getBoundingClientRect();
    if (rectangle.top < window.innerHeight && rectangle.bottom > 0) {
      played.add(element);
    } else {
      pending.add(element);
      observer.observe(element);
    }
  }
  settleFragment();
  document.addEventListener('focusin', (event) => {
    if (event.target instanceof Element && event.target.matches(':active')) return;
    if (event.target instanceof window.Node) settleRelated(event.target);
  });
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof window.Node)) return;
    for (const element of new Set([...pending, ...active.keys()])) {
      if (element.contains(event.target)) settle(element);
    }
  });
  window.addEventListener('hashchange', settleFragment);
  window.addEventListener('beforeprint', settleAll);
  motion.addEventListener('change', (event) => {
    if (event.matches) settleAll();
  });
}

initialiseReveals();

export {};
