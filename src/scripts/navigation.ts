type MenuState =
  | { kind: 'desktop' | 'closed' }
  | { kind: 'open'; animation: Animation | null }
  | { kind: 'closing'; animation: Animation };

function initialiseNavigation(toggle: HTMLButtonElement, nav: HTMLElement) {
  const mobile = window.matchMedia('(max-width: 900px)');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const supportsInert = 'inert' in nav;
  let state: MenuState = { kind: 'closed' };
  // CSS may clear focus before the breakpoint callback runs.
  let focusedControl: 'navigation' | 'toggle' | null = null;

  const animation = () =>
    state.kind === 'open' || state.kind === 'closing' ? state.animation : null;
  const render = () => {
    toggle.setAttribute('aria-expanded', String(state.kind === 'open'));
    nav.classList.toggle('is-open', state.kind === 'open');
    nav.classList.toggle('is-closing', state.kind === 'closing');
    nav.dataset.menuState = state.kind;
    if (supportsInert) nav.inert = state.kind === 'closed' || state.kind === 'closing';
  };
  const settle = (kind: 'desktop' | 'closed' | 'open') => {
    animation()?.cancel();
    state = kind === 'open' ? { kind, animation: null } : { kind };
    render();
  };
  const transition = (open: boolean) => {
    if (!mobile.matches || (!open && (state.kind === 'closed' || state.kind === 'closing'))) return;
    if (!open && nav.contains(document.activeElement)) toggle.focus();
    if (motion.matches || !supportsInert || typeof nav.animate !== 'function') {
      settle(open ? 'open' : 'closed');
      return;
    }
    const current = animation();
    const style = current ? getComputedStyle(nav) : null;
    const from = {
      opacity: style?.opacity ?? (open ? '0' : '1'),
      transform: style?.transform ?? (open ? 'translateY(-8px)' : 'none'),
    };
    current?.cancel();
    if (open) {
      state = { kind: 'open', animation: null };
      render();
    } else {
      toggle.setAttribute('aria-expanded', 'false');
      nav.inert = true;
    }
    const effect = nav.animate(
      [from, { opacity: open ? '1' : '0', transform: open ? 'none' : 'translateY(-8px)' }],
      { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' },
    );
    state = { kind: open ? 'open' : 'closing', animation: effect };
    render();
    effect.finished.then(
      () => {
        if (animation() !== effect) return;
        settle(open ? 'open' : 'closed');
      },
      () => undefined,
    );
  };
  const resize = () => {
    const active = document.activeElement;
    const focusInNav =
      nav.contains(active) || (active === document.body && focusedControl === 'navigation');
    const focusOnToggle =
      active === toggle || (active === document.body && focusedControl === 'toggle');
    if (mobile.matches) {
      if (focusInNav) toggle.focus();
      settle('closed');
    } else {
      settle('desktop');
      if (focusOnToggle) nav.querySelector<HTMLAnchorElement>('a')?.focus();
    }
  };

  document.addEventListener('focusin', (event) => {
    focusedControl =
      event.target === toggle
        ? 'toggle'
        : event.target instanceof Node && nav.contains(event.target)
          ? 'navigation'
          : null;
  });
  document.addEventListener('focusout', () => {
    if (mobile.matches === (state.kind !== 'desktop')) focusedControl = null;
  });
  document.addEventListener('pointerdown', (event) => {
    if (
      event.target instanceof Node &&
      !nav.contains(event.target) &&
      !toggle.contains(event.target)
    )
      focusedControl = null;
  });

  toggle.closest('header')?.setAttribute('data-navigation-ready', 'true');
  resize();
  toggle.addEventListener('click', () => transition(state.kind !== 'open'));
  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      mobile.matches &&
      (state.kind === 'open' || state.kind === 'closing')
    ) {
      toggle.focus();
      transition(false);
    }
  });
  nav
    .querySelectorAll('a')
    .forEach((link) => link.addEventListener('click', () => transition(false)));
  mobile.addEventListener('change', resize);
  motion.addEventListener('change', (event) => {
    if (event.matches && (state.kind === 'open' || state.kind === 'closing')) {
      settle(state.kind === 'open' ? 'open' : 'closed');
    }
  });
  window.addEventListener('pagehide', () => {
    if (mobile.matches) settle('closed');
  });
}

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-navigation');
if (toggle instanceof HTMLButtonElement && nav instanceof HTMLElement) {
  initialiseNavigation(toggle, nav);
}

export {};
