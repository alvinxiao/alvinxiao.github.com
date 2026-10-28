import { workflowDuration as duration, workflowTiming } from '../content/workflow-example';
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
  const previewFallback = root.querySelector('.email-preview-fallback');
  const stepButtons = [...root.querySelectorAll('[data-email-step]')].filter(
    (element): element is HTMLButtonElement => element instanceof HTMLButtonElement,
  );
  const details = [...root.querySelectorAll('[data-email-detail]')].filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
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
    !(previewFallback instanceof HTMLElement) ||
    stepButtons.length !== workflowTiming.length ||
    details.length !== workflowTiming.length ||
    markers.length !== workflowTiming.length ||
    typeof carrier.animate !== 'function' ||
    typeof window.IntersectionObserver !== 'function' ||
    typeof window.ResizeObserver !== 'function'
  )
    return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const causes = new Set<PauseCause>();
  let run: Run = motion.matches ? 'inactive' : 'active';
  let animations: Animation[] = [];
  let frameRequest: number | undefined;
  let staticSelection: number | null = null;
  let displayedSelection: number | null | undefined;
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

  const stopFrames = () => {
    if (frameRequest !== undefined) window.cancelAnimationFrame(frameRequest);
    frameRequest = undefined;
  };
  const syncDetails = () => {
    const master = animations[0];
    const time = master && typeof master.currentTime === 'number' ? master.currentTime : 0;
    let current: number | null = staticSelection;
    if (run === 'active' || run === 'complete') {
      current = 0;
      for (const [index, timing] of workflowTiming.entries())
        if (time >= timing.arrival * duration) current = index;
    }
    if (run === 'unavailable') current = null;
    if (current === displayedSelection) return;
    displayedSelection = current;
    root.toggleAttribute('data-email-details', current !== null);
    if (current === null) delete root.dataset.emailCurrent;
    else root.dataset.emailCurrent = String(current);
    previewFallback.setAttribute('aria-hidden', String(current !== null));
    for (const [index, detail] of details.entries()) {
      detail.toggleAttribute('data-current', index === current);
      detail.setAttribute('aria-hidden', String(index !== current));
    }
    for (const [index, button] of stepButtons.entries()) {
      if (index === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    }
  };
  const tick = () => {
    frameRequest = undefined;
    syncDetails();
    if (run === 'active' && causes.size === 0 && !motion.matches)
      frameRequest = window.requestAnimationFrame(tick);
  };
  const cancel = () => {
    stopFrames();
    for (const animation of animations) {
      animation.onfinish = null;
      animation.cancel();
    }
    animations = [];
  };
  const render = () => {
    controls.hidden = motion.matches || run === 'unavailable';
    root.toggleAttribute('data-email-interactive', run !== 'unavailable');
    root.toggleAttribute(
      'data-email-enhanced',
      (run === 'active' || run === 'complete') && !motion.matches,
    );
    pause.disabled = run !== 'active';
    const canSelect =
      (run === 'active' && causes.has('user')) ||
      run === 'complete' ||
      (run === 'inactive' && motion.matches);
    for (const button of stepButtons) button.disabled = !canSelect;
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
    syncDetails();
    if (playing) {
      if (frameRequest === undefined) frameRequest = window.requestAnimationFrame(tick);
    } else stopFrames();
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
    const offsets = workflowTiming.map(({ arrival, holdUntil }) => [arrival, holdUntil]);
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
      const [requestTiming, historyTiming, voiceTiming, draftTiming, deliveryTiming] =
        workflowTiming;
      const glyphWindows = [
        {
          glyph: request,
          start: 0,
          visible: 0,
          fade: requestTiming.holdUntil,
          end: historyTiming.arrival,
        },
        {
          glyph: thinking,
          start: requestTiming.holdUntil,
          visible: historyTiming.arrival,
          fade: voiceTiming.holdUntil,
          end: draftTiming.arrival,
        },
        {
          glyph: documentGlyph,
          start: voiceTiming.holdUntil,
          visible: draftTiming.arrival,
          fade: draftTiming.holdUntil,
          end: deliveryTiming.arrival,
        },
        {
          glyph: email,
          start: draftTiming.holdUntil,
          visible: deliveryTiming.arrival,
          fade: 1,
          end: 1,
        },
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
      for (const [index, timing] of workflowTiming.entries()) {
        const marker = markers[index];
        if (!marker) continue;
        const arrival = timing.arrival;
        const revealFrames: Keyframe[] =
          arrival === 0
            ? [{ opacity: 1 }]
            : [
                { opacity: 0, offset: 0, easing: 'steps(1, end)' },
                { opacity: 1, offset: arrival },
                { opacity: 1, offset: 1 },
              ];
        animations.push(marker.animate(revealFrames, options));
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
      render();
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
  for (const [index, button] of stepButtons.entries()) {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      const timing = workflowTiming[index];
      if (!timing) return;
      if (run === 'inactive' && motion.matches) staticSelection = index;
      else {
        run = 'active';
        causes.add('user');
        for (const animation of animations) {
          animation.pause();
          animation.currentTime = timing.arrival * duration;
        }
      }
      render();
    });
  }
  for (const radio of root.querySelectorAll('input[name="email-delivery"]')) {
    radio.addEventListener('change', () => {
      if ((run === 'active' || run === 'complete') && !causes.has('user')) restart(false);
      else render();
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
      staticSelection = null;
    }
    render();
  });
  build(0);
}

for (const root of document.querySelectorAll('.workflow-example')) {
  if (root instanceof HTMLElement) initialiseEmailWorkflow(root);
}
export {};
