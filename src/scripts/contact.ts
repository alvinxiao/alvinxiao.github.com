import { services } from '../content/services';
import { confirmationKey, interests, isInterest, validateInquiry } from '../lib/inquiry/model';
import type { FieldErrors, InquiryState } from '../lib/inquiry/model';

const form = document.querySelector('#inquiry-form');
if (form instanceof HTMLFormElement) {
  const name = form.elements.namedItem('name');
  const email = form.elements.namedItem('email');
  const interest = form.elements.namedItem('interest');
  const description = form.elements.namedItem('description');
  const context = form.elements.namedItem('optional_context');
  const trap = form.elements.namedItem('_gotcha');
  const submit = form.querySelector('button[type="submit"]');
  const summary = form.querySelector('#error-summary');
  const status = form.querySelector('#form-status');
  const contextField = form.querySelector('#context-field');
  const contextLabel = form.querySelector('#context-label');
  if (!(
    name instanceof HTMLInputElement &&
    email instanceof HTMLInputElement &&
    interest instanceof HTMLSelectElement &&
    description instanceof HTMLTextAreaElement &&
    context instanceof HTMLTextAreaElement &&
    trap instanceof HTMLInputElement &&
    submit instanceof HTMLButtonElement &&
    summary instanceof HTMLElement &&
    status instanceof HTMLElement &&
    contextField instanceof HTMLElement &&
    contextLabel instanceof HTMLElement
  ))
    throw new Error('Inquiry form is incomplete.');
  let state: InquiryState = { kind: 'idle' };
  const preselected = services.find(
    (service) => service.id === new URLSearchParams(location.search).get('service'),
  );
  if (preselected) interest.value = preselected.interest;
  const updateContext = () => {
    const prompt = isInterest(interest.value) ? interests[interest.value].prompt : '';
    contextField.hidden = !prompt;
    context.disabled = !prompt;
    context.value = '';
    contextLabel.textContent = prompt;
  };
  updateContext();
  interest.addEventListener('change', updateContext);
  const renderErrors = (errors: FieldErrors) => {
    const list = summary.querySelector('ul');
    if (!list) return;
    list.replaceChildren();
    for (const [key, field] of [
      ['name', name],
      ['email', email],
      ['interest', interest],
      ['description', description],
      ['optional_context', context],
    ] satisfies [keyof FieldErrors, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement][]) {
      const message = errors[key];
      const error = document.getElementById(`${field.name}-error`);
      field.setAttribute('aria-invalid', String(Boolean(message)));
      if (error) {
        error.textContent = message || '';
        error.hidden = !message;
      }
      if (message) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${field.id}`;
        link.textContent = message;
        item.append(link);
        list.append(item);
      }
    }
    summary.hidden = Object.keys(errors).length === 0;
    if (!summary.hidden) summary.focus();
  };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.dataset['prelaunch'] === 'true') {
      status.textContent = 'Inquiries are not live during prelaunch. No inquiry has been sent.';
      status.focus();
      return;
    }
    if (state.kind === 'pending' || state.kind === 'confirmed') return;
    status.textContent = '';
    const data = {
      name: name.value.trim(),
      email: email.value.trim(),
      interest: interest.value,
      description: description.value.trim(),
      optional_context: context.disabled ? '' : context.value.trim(),
    };
    const errors = validateInquiry(data);
    renderErrors(errors);
    if (Object.keys(errors).length) {
      state = { kind: 'invalid', errors };
      return;
    }
    const endpoint = form.dataset['endpoint'];
    if (!endpoint || !/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9-]+$/.test(endpoint)) {
      state = {
        kind: 'failed',
        message:
          'Sending is not available in this review preview. No inquiry has been sent. Contact details and the form endpoint need owner approval.',
      };
      status.textContent = state.message;
      status.focus();
      return;
    }
    if (trap.value) {
      state = {
        kind: 'failed',
        message: 'The form could not be submitted. Please leave the website field empty.',
      };
      status.textContent = state.message;
      return;
    }
    state = { kind: 'pending' };
    submit.disabled = true;
    submit.querySelector('span')?.replaceChildren('Sending…');
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your inquiry. Please wait.';
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const payload = new FormData();
      for (const [key, value] of Object.entries(data))
        if (key !== 'optional_context' || !context.disabled) payload.set(key, value);
      if (preselected && preselected.interest === interest.value)
        payload.set('source_service', preselected.id);
      payload.set('_gotcha', '');
      const response = await fetch(endpoint, {
        method: 'POST',
        body: payload,
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        const message =
          response.status === 429
            ? 'The inquiry service is temporarily at its limit. Your details are still here. Please wait before trying again, or use the email option.'
            : 'The inquiry service could not accept your message. Your details are still here. Please check them and try again, or use the email option.';
        state =
          response.status >= 500
            ? {
                kind: 'uncertain',
                message:
                  'The inquiry service had a problem and could not confirm submission. Your inquiry may have arrived. Your details are still here. To avoid a duplicate, check before deliberately sending again, or use the email option.',
              }
            : { kind: 'failed', message };
      } else {
        const result: unknown = await response.json();
        if (typeof result === 'object' && result !== null && 'ok' in result && result.ok === true) {
          state = { kind: 'confirmed' };
          try {
            sessionStorage.setItem(confirmationKey, String(Date.now()));
          } catch {
            /* Confirmation stays neutral if storage is unavailable. */
          }
          location.assign('/thank-you/');
        } else {
          state = {
            kind: 'uncertain',
            message:
              'The service returned an unclear response and could not confirm submission. Your inquiry may have arrived. Your details are still here. To avoid a duplicate, check before deliberately sending again, or use the email option.',
          };
        }
      }
    } catch {
      state = {
        kind: 'uncertain',
        message:
          'The connection was interrupted or timed out. Your inquiry may have arrived. Your details are still here. To avoid a duplicate, check before deliberately sending again, or use the email option.',
      };
    } finally {
      window.clearTimeout(timer);
      form.removeAttribute('aria-busy');
      if (state.kind !== 'confirmed') {
        submit.disabled = false;
        submit.querySelector('span')?.replaceChildren('Try sending again');
      }
    }
    if (state.kind === 'failed' || state.kind === 'uncertain') {
      status.textContent = state.message;
      status.focus();
    }
  });
  submit.disabled = form.dataset['prelaunch'] === 'true';
}
