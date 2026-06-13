export function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

export function popularityBadge(totalDl) {
  if (totalDl >= 10) {
    return `<span class="badge badge-popular"><i data-lucide="flame" class="icon-xxs badge-icon"></i> Popular</span>`;
  }
  if (totalDl >= 3) {
    return `<span class="badge badge-interest"><i data-lucide="trending-up" class="icon-xxs badge-icon"></i> Interés Reciente</span>`;
  }
  return '';
}
