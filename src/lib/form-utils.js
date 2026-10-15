export function messageFromEntries(entries) {
  return [...entries].filter(([key]) => !key.startsWith('_')).map(([key, value]) => {
    if (typeof value !== 'string') throw new Error('Files require an endpoint form.');
    return `${key}: ${value.trim()}`;
  }).join('\n');
}

export function buildDraftURL(mode, recipient, message, { subject = 'Website inquiry', ios = false } = {}) {
  const target = String(recipient || '').trim();
  const body = encodeURIComponent(message);
  if (mode === 'mailto') {
    if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(target) || /[\r\n]/.test(target)) throw new Error('Configure a valid email recipient.');
    return `mailto:${target}?subject=${encodeURIComponent(subject)}&body=${body}`;
  }
  if (mode === 'sms') {
    if (!/^\+?[\d ()\.\-]+$/.test(target) || target.replace(/\D/g, '').length < 7 || /[\r\n]/.test(target)) throw new Error('Configure a valid phone recipient.');
    return `sms:${target.replace(/[^\d+]/g, '')}${ios ? '&' : '?'}body=${body}`;
  }
  throw new Error('Unsupported draft mode.');
}

export function endpointURL(action, baseURL) {
  if (!action || action.trim().startsWith('#')) throw new Error('Configure a real form action first.');
  const url = new URL(action, baseURL);
  if (url.username || url.password) throw new Error('Do not embed credentials in a form action.');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) throw new Error('Use an HTTPS form endpoint.');
  return url.href;
}
