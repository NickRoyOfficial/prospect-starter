import { messageFromEntries, buildDraftURL, endpointURL } from './form-utils.js';
const initialized = new WeakSet();

export function initForms(root = document) {
  for (const form of root.querySelectorAll('form[data-form]')) {
    if (initialized.has(form)) continue;
    initialized.add(form);
    let pending = false;
    let status = form.querySelector('[data-form-status]');
    if (!status) { status = document.createElement('p'); status.dataset.formStatus = ''; form.append(status); }
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending || !form.reportValidity()) return;
      pending = true;
      const buttons = [...form.querySelectorAll('button[type="submit"], input[type="submit"]')];
      const priorStates = buttons.map(button => button.disabled);
      buttons.forEach(button => { button.disabled = true; });
      form.setAttribute('aria-busy', 'true');
      status.replaceChildren();
      try {
        const data = new FormData(form);
        const mode = form.dataset.form;
        if (mode === 'endpoint') {
          const url = endpointURL(form.getAttribute('action'), location.href);
          const response = await fetch(url, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
          if (!response.ok) throw new Error('The request was not accepted. Please try again or use another contact method.');
          status.textContent = form.dataset.successMessage || 'Your request was accepted.';
          form.dispatchEvent(new CustomEvent('prospect:form-success', { bubbles: true }));
        } else if (mode === 'mailto' || mode === 'sms') {
          const message = messageFromEntries(data);
          const url = buildDraftURL(mode, form.dataset.recipient, message, { subject: form.dataset.subject, ios: /iPad|iPhone|iPod/.test(navigator.userAgent) });
          const preview = document.createElement('pre');
          preview.style.whiteSpace = 'pre-wrap';
          preview.textContent = message;
          const link = document.createElement('a');
          link.href = url;
          link.textContent = mode === 'sms' ? 'Open text message draft' : 'Open email draft';
          status.append('Review your draft. Nothing has been sent.', preview, link);
        } else if (mode === 'copy') {
          const message = messageFromEntries(data);
          try {
            await navigator.clipboard.writeText(message);
            status.textContent = 'Copied. Paste your inquiry into your preferred contact app.';
          } catch {
            const preview = document.createElement('textarea');
            preview.readOnly = true;
            preview.value = message;
            preview.setAttribute('aria-label', 'Inquiry text to copy');
            status.append('Copy the inquiry below. Nothing has been sent.', preview);
            preview.focus();
            preview.select();
          }
        } else throw new Error('This form has no configured delivery method.');
      } catch (error) {
        status.textContent = ['TimeoutError', 'AbortError'].includes(error.name) ? 'The request timed out. Please try again or use another contact method.' : error instanceof TypeError ? 'The request could not be completed. Check your connection or use another contact method.' : error.message;
        form.dispatchEvent(new CustomEvent('prospect:form-error', { bubbles: true }));
      } finally {
        pending = false;
        form.removeAttribute('aria-busy');
        buttons.forEach((button, i) => { button.disabled = priorStates[i]; });
      }
    });
  }
}
