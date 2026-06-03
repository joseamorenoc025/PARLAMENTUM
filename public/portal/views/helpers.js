export function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

export function popularityBadge(totalDl) {
  if (totalDl >= 10) {
    return `<span class="badge badge-popular"><i data-lucide="flame" style="width:10px;height:10px;display:inline;margin-right:2px;"></i> Popular</span>`;
  }
  if (totalDl >= 3) {
    return `<span class="badge badge-interest"><i data-lucide="trending-up" style="width:10px;height:10px;display:inline;margin-right:2px;"></i> Interés Reciente</span>`;
  }
  return '';
}
