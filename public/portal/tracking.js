import { allLaws } from './data.js';

export function trackDownload(title, type, id) {
  if (window.plausible) window.plausible('Download', { props: { title, type, id } });
  incrementDownload(type, id);
}

export function trackSearch(term) {
  if (window.plausible) window.plausible('Search', { props: { term } });
}

export function trackProfileView(name) {
  if (window.plausible) window.plausible('Profile View', { props: { name } });
}

export function trackPreview(title, type, id) {
  if (window.plausible) window.plausible('Preview PDF', { props: { title, type, id } });
}

export function getDownloadCount(entityType, entityId) {
  return parseInt(localStorage.getItem(`dl_${entityType}_${entityId}`) || '0');
}

export function incrementDownload(entityType, entityId) {
  const key = `dl_${entityType}_${entityId}`;
  const count = getDownloadCount(entityType, entityId) + 1;
  localStorage.setItem(key, String(count));
  const badge = document.getElementById(`dl-badge-${entityType}-${entityId}`);
  if (badge) {
    badge.textContent = `${count}`;
    badge.closest('.download-counter')?.classList.add('has-downloads');
  }
  if (entityType === 'ley') {
    const globalCount = document.getElementById('global-law-count');
    if (globalCount) globalCount.textContent = getTotalDownloads('ley', allLaws);
  }
  return count;
}

export function buildCounterBadge(entityType, entityId) {
  const count = getDownloadCount(entityType, entityId);
  return `<div class="download-counter${count > 0 ? ' has-downloads' : ''}"><i data-lucide="arrow-down-to-line" class="icon-xxs"></i> <span id="dl-badge-${entityType}-${entityId}">${count}</span></div>`;
}

export function getTotalDownloads(entityType, items) {
  return items.reduce((sum, item) => sum + getDownloadCount(entityType, item.id), 0);
}
