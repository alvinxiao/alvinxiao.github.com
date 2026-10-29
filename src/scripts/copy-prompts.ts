for (const wrapper of document.querySelectorAll('.practice-prompt[data-copy-prompt]')) {
  if (!(wrapper instanceof HTMLElement) || wrapper.hasAttribute('data-copy-ready')) continue;
  const prompt = wrapper.querySelector(':scope > blockquote');
  if (!(prompt instanceof HTMLElement) || !prompt.innerText.trim()) continue;

  const controls = document.createElement('div');
  controls.className = 'prompt-copy-controls';
  controls.setAttribute('data-copy-controls', '');
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Copy prompt';
  button.setAttribute('data-copy-button', '');
  button.setAttribute('aria-label', `Copy prompt: ${wrapper.dataset.copyPrompt}`);
  const status = document.createElement('span');
  status.className = 'prompt-copy-status';
  status.setAttribute('data-copy-status', '');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  let copying = false;

  button.addEventListener('click', async () => {
    if (copying) return;
    copying = true;
    button.setAttribute('aria-disabled', 'true');
    status.textContent = 'Copying...';
    try {
      const text = prompt.innerText.trim();
      if (!text || typeof navigator.clipboard?.writeText !== 'function') {
        status.textContent = 'Could not copy. Select the prompt and copy it.';
        return;
      }
      await navigator.clipboard.writeText(text);
      status.textContent = 'Copied.';
    } catch {
      status.textContent = 'Could not copy. Select the prompt and copy it.';
    } finally {
      copying = false;
      button.removeAttribute('aria-disabled');
    }
  });

  controls.append(button, status);
  wrapper.append(controls);
  wrapper.setAttribute('data-copy-ready', '');
}

export {};
