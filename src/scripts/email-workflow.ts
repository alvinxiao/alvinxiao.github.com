const duration = 6800;
type PauseCause = 'user' | 'viewport' | 'document';
type Run = 'inactive' | 'active' | 'complete' | 'unavailable';

function initialiseEmailWorkflow(root: HTMLElement) {
  const chain = root.querySelector('.email-chain');
  const carrier = root.querySelector('.email-carrier');
  const track = root.querySelector('.email-track');
  const path = track?.querySelector('path');
  const request = root.querySelector('[data-shape="request"]');
  const thinking = root.querySelector('[data-shape="thinking"]');
  const documentGlyph = root.querySelector('[data-shape="document"]');
  const email = root.querySelector('[data-shape="email"]');
  const controls = root.querySelector('.email-animation-controls');
  const pause = root.querySelector('[data-email-pause]');
  const replay = root.querySelector('[data-email-replay]');
  const markers = [...root.querySelectorAll('.email-stage-marker')].filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
  if (
    !(chain instanceof HTMLElement) ||
    !(carrier instanceof HTMLElement) ||
    !(track instanceof SVGElement) ||
    !(path instanceof SVGPathElement) ||
    !(request instanceof HTMLElement) ||
    !(thinking instanceof HTMLElement) ||
    !(documentGlyph instanceof HTMLElement) ||
    !(email instanceof HTMLElement) ||
    !(controls instanceof HTMLElement) ||
    !(pause instanceof HTMLButtonElement) ||
    !(replay instanceof HTMLButtonElement) ||
    markers.length !== 5 ||
    typeof carrier.animate !== 'function' ||
    typeof window.IntersectionObserver !== 'function' ||
    typeof window.ResizeObserver !== 'function'
  )
    return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const causes = new Set<PauseCause>();
  let run: Run = motion.matches ? 'inactive' : 'active';
  let animations: Animation[] = [];
  const inViewport = () => {
    const rect = chain.getBoundingClientRect();
    return (
      rect.bottom > 0 &&
      rect.top < window.innerHeight &&
      rect.right > 0 &&
      rect.left < window.innerWidth
    );
  };
  const updateCause = (cause: PauseCause, blocked: boolean) => {
    if (blocked) causes.add(cause);
    else causes.delete(cause);
  };
  updateCause('viewport', !inViewport());
  updateCause('document', document.visibilityState !== 'visible');

  const cancel = () => {
    for (const animation of animations) {
      animation.onfinish = null;
      animation.cancel();
    }
    animations = [];
  };
  const render = () => {
    controls.hidden = motion.matches || run === 'unavailable';
    root.toggleAttribute(
      'data-email-enhanced',
      (run === 'active' || run === 'complete') && !motion.matches,
    );
    pause.disabled = run !== 'active';
    pause.textContent = causes.has('user') ? 'Resume' : 'Pause';
    pause.setAttribute(
      'aria-label',
      causes.has('user') ? 'Resume email animation' : 'Pause email animation',
    );
    const playing = run === 'active' && causes.size === 0 && !motion.matches;
    for (const animation of animations) {
      if (playing) animation.play();
      else animation.pause();
    }
    root.dataset.emailState =
      run === 'inactive' || run === 'unavailable'
        ? 'static'
        : run === 'complete'
          ? 'complete'
          : playing
            ? 'playing'
            : 'paused';
  };
  const build = (time: number) => {
    cancel();
    const bounds = chain.getBoundingClientRect();
    const points = markers.map((marker) => {
      const rect = marker.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - bounds.left,
        y: rect.top + rect.height / 2 - bounds.top,
      };
    });
    track.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    path.setAttribute(
      'd',
      points.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' '),
    );
    if (run === 'inactive' || run === 'unavailable' || motion.matches) {
      render();
      return;
    }
    const offsets = [
      [0, 0.08],
      [0.24, 0.32],
      [0.48, 0.56],
      [0.72, 0.8],
      [0.96, 1],
    ];
    const frames: Keyframe[] = points.flatMap((point, index) =>
      (offsets[index] || []).map((offset) => ({
        transform: `translate(${point.x}px, ${point.y}px)`,
        offset,
        easing: 'cubic-bezier(0.45, 0, 0.2, 1)',
      })),
    );
    const options: KeyframeAnimationOptions = { duration, fill: 'both', easing: 'linear' };
    try {
      animations.push(carrier.animate(frames, options));
      const glyphWindows = [
        { glyph: request, start: 0, visible: 0, fade: 0.16, end: 0.24 },
        { glyph: thinking, start: 0.16, visible: 0.24, fade: 0.6, end: 0.72 },
        { glyph: documentGlyph, start: 0.6, visible: 0.72, fade: 0.84, end: 0.96 },
        { glyph: email, start: 0.84, visible: 0.96, fade: 1, end: 1 },
      ];
      for (const { glyph, start, visible, fade, end } of glyphWindows) {
        const glyphFrames: Keyframe[] = [
          { opacity: start === 0 ? 1 : 0, transform: 'scale(.7)', offset: 0 },
        ];
        if (start > 0) glyphFrames.push({ opacity: 0, transform: 'scale(.7)', offset: start });
        glyphFrames.push(
          { opacity: 1, transform: 'scale(1)', offset: visible },
          { opacity: 1, transform: 'scale(1)', offset: fade },
        );
        if (end < 1) {
          glyphFrames.push({ opacity: 0, transform: 'scale(.7)', offset: end });
          glyphFrames.push({ opacity: 0, offset: 1 });
        }
        animations.push(glyph.animate(glyphFrames, options));
      }
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = time;
      }
      const master = animations[0];
      if (master)
        master.onfinish = () => {
          run = 'complete';
          for (const animation of animations) {
            animation.pause();
            animation.currentTime = duration;
          }
          render();
        };
    } catch {
      cancel();
      run = 'unavailable';
      controls.hidden = true;
      root.removeAttribute('data-email-enhanced');
      root.dataset.emailState = 'static';
      return;
    }
    render();
  };
  const restart = (clearUserPause: boolean) => {
    if (motion.matches || run === 'unavailable') return;
    if (clearUserPause) causes.delete('user');
    run = 'active';
    updateCause('viewport', !inViewport());
    build(0);
  };
  let observer: IntersectionObserver | undefined;
  let resize: ResizeObserver | undefined;
  try {
    observer = new window.IntersectionObserver((entries) => {
      for (const entry of entries)
        if (entry.target === chain) updateCause('viewport', !entry.isIntersecting);
      render();
    });
    resize = new window.ResizeObserver(() => {
      const master = animations[0];
      const time = master && typeof master.currentTime === 'number' ? master.currentTime : 0;
      build(time);
    });
    observer.observe(chain);
    resize.observe(chain);
  } catch {
    observer?.disconnect();
    resize?.disconnect();
    return;
  }
  pause.addEventListener('click', () => {
    if (run !== 'active') return;
    updateCause('user', !causes.has('user'));
    render();
  });
  replay.addEventListener('click', () => restart(true));
  for (const radio of root.querySelectorAll('input[name="email-delivery"]')) {
    radio.addEventListener('change', () => {
      if ((run === 'active' || run === 'complete') && !causes.has('user')) restart(false);
    });
  }
  document.addEventListener('visibilitychange', () => {
    updateCause('document', document.visibilityState !== 'visible');
    render();
  });
  window.addEventListener('pageshow', () => {
    updateCause('viewport', !inViewport());
    updateCause('document', document.visibilityState !== 'visible');
    render();
  });
  motion.addEventListener('change', () => {
    if (run === 'unavailable') return;
    if (motion.matches) {
      cancel();
      run = 'inactive';
    }
    render();
  });
  build(0);
}

for (const root of document.querySelectorAll('.workflow-example')) {
  if (root instanceof HTMLElement) initialiseEmailWorkflow(root);
}
export {};
