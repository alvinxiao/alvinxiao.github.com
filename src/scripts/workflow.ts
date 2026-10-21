type PlaybackInputs = {
  viewportVisible: boolean;
  documentVisible: boolean;
  reducedMotion: boolean;
  userPaused: boolean;
};

function initialiseWorkflow(figure: HTMLElement, pause: HTMLInputElement) {
  if (typeof window.IntersectionObserver !== 'function') return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const inViewport = () => {
    const bounds = figure.getBoundingClientRect();
    return (
      bounds.bottom > 0 &&
      bounds.top < window.innerHeight &&
      bounds.right > 0 &&
      bounds.left < window.innerWidth
    );
  };
  const inputs: PlaybackInputs = {
    viewportVisible: inViewport(),
    documentVisible: document.visibilityState === 'visible',
    reducedMotion: motion.matches,
    userPaused: pause.checked,
  };
  const render = () => {
    const canPlay =
      inputs.viewportVisible &&
      inputs.documentVisible &&
      !inputs.reducedMotion &&
      !inputs.userPaused;
    figure.toggleAttribute('data-workflow-paused', !canPlay);
  };
  let observer: IntersectionObserver | undefined;
  try {
    observer = new window.IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== figure) continue;
        inputs.viewportVisible = entry.isIntersecting;
        render();
      }
    });
    observer.observe(figure);
  } catch {
    observer?.disconnect();
    return;
  }
  const refresh = () => {
    inputs.viewportVisible = inViewport();
    inputs.documentVisible = document.visibilityState === 'visible';
    inputs.reducedMotion = motion.matches;
    inputs.userPaused = pause.checked;
    render();
  };
  pause.addEventListener('change', () => {
    inputs.userPaused = pause.checked;
    render();
  });
  document.addEventListener('visibilitychange', refresh);
  motion.addEventListener('change', () => {
    inputs.reducedMotion = motion.matches;
    render();
  });
  window.addEventListener('pageshow', refresh);
  render();
}

for (const figure of document.querySelectorAll('.workflow-illustration')) {
  const pause = figure.querySelector('.workflow-motion-control input');
  if (figure instanceof HTMLElement && pause instanceof HTMLInputElement) {
    initialiseWorkflow(figure, pause);
  }
}

export {};
