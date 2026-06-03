import { allLaws } from '../data.js';
import { showStatus, hideStatus } from '../ui.js';
import { search } from '../search.js';
import { getDownloadCount, getTotalDownloads, buildCounterBadge, trackDownload, trackPreview } from '../tracking.js';
import { escapeHTML, popularityBadge } from './helpers.js';

function getYear(law) {
  if (law.fecha_publicacion) {
    const d = new Date(law.fecha_publicacion + 'T12:00:00');
    if (!isNaN(d.getTime())) return d.getFullYear();
  }
  return law.anio;
}

export function setupLawsFilters(container) {
  const yearSelect = document.createElement('select');
  yearSelect.id = 'filter-year';
  yearSelect.innerHTML = '<option value="">Todos los años</option>';
  const years = [...new Set(allLaws.map(l => getYear(l)).filter(Boolean))].sort((a, b) => b - a);
  years.forEach(y => yearSelect.innerHTML += `<option value="${y}">${y}</option>`);

  const typeSelect = document.createElement('select');
  typeSelect.id = 'filter-type';
  typeSelect.innerHTML = '<option value="">Gaceta: Todas</option><option value="Ordinaria">Ordinaria</option><option value="Extraordinaria">Extraordinaria</option>';

  const tagSelect = document.createElement('select');
  tagSelect.id = 'filter-tag';
  tagSelect.innerHTML = '<option value="">Materia / Eje Temático</option>';
  const allTags = new Set();
  allLaws.forEach(l => { if (l.tags) l.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => allTags.add(t)); });
  Array.from(allTags).sort().forEach(t => { tagSelect.innerHTML += `<option value="${t}">#${t}</option>`; });

  container.appendChild(yearSelect);
  container.appendChild(typeSelect);
  container.appendChild(tagSelect);

  return { yearSelect, typeSelect, tagSelect };
}

export function renderLaws(term, renderCurrentView) {
  const mainGrid = document.getElementById('main-grid');
  const year = document.getElementById('filter-year')?.value;
  const type = document.getElementById('filter-type')?.value;
  const selectedTag = document.getElementById('filter-tag')?.value;

  let filtered = allLaws;

  if (term.length >= 2) {
    const results = search('laws', term);
    if (results) {
      filtered = results.map(r => r.item);
      if (results.length === 0) { showStatus('No se encontraron leyes.', 'info'); return; }
    }
  } else if (term.length > 0) {
    filtered = allLaws.filter(l =>
      l.titulo.toLowerCase().includes(term) ||
      (l.expediente && l.expediente.toLowerCase().includes(term)) ||
      (l.tags && l.tags.toLowerCase().includes(term))
    );
  }

  filtered = filtered.filter(l => {
    const matchYear = !year || String(getYear(l)) === year;
    const lawType = l.gaceta || l.tipo || 'Ordinaria';
    return matchYear && (!type || lawType === type) &&
      (!selectedTag || (l.tags && l.tags.split(',').map(t => t.trim().toLowerCase()).includes(selectedTag.toLowerCase())));
  });

  if (filtered.length === 0) { showStatus('No se encontraron leyes.', 'info'); return; }
  hideStatus();

  filtered.forEach(l => {
    const card = document.createElement('div');
    card.className = 'card';

    const localDl = getDownloadCount('ley', l.id);
    const totalDl = localDl + (l.descargas || 0);
    const yearDisplay = getYear(l) || 'N/A';

    card.innerHTML = `
      <div class="card-header-row">
        <span class="law-tag">${l.gaceta || l.tipo || 'Ordinaria'}</span>
        ${popularityBadge(totalDl)}
      </div>
      <h3 class="law-title">${escapeHTML(l.titulo)}</h3>
      <div class="law-meta">
        <span class="meta-item"><i data-lucide="file-text" style="width:12px"></i> ${l.expediente || 'No asignado'}</span>
        <span class="meta-item"><i data-lucide="calendar" style="width:12px"></i> ${yearDisplay}</span>
      </div>
      ${renderTags(l.tags || l.materia, renderCurrentView)}
      ${renderLawActions(l, card)}
      ${renderAdjuntos(l.adjuntos, l.id)}
    `;
    mainGrid.appendChild(card);
  });

  appendGlobalBanner(mainGrid);
}

function renderTags(tagsStr, renderCurrentView) {
  if (!tagsStr) return '';
  const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
  if (tags.length === 0) return '';
  return `<div class="tag-badges-container">${tags.map(t => `<span class="tag-badge-clickable" data-tag="${escapeHTML(t)}">#${escapeHTML(t)}</span>`).join('')}</div>`;
}

function renderLawActions(l, card) {
  if (!l.link_drive) return '';
  return `
    <div class="law-actions">
      <button class="btn-primary" data-preview="${escapeHTML(l.link_drive)}" data-title="${escapeHTML(l.titulo)}" data-type="ley" data-id="${l.id}">
        <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Ver PDF
      </button>
      <a href="${escapeHTML(l.link_drive)}" target="_blank" class="btn-secondary" data-track-download="${l.id}" data-track-type="ley">
        <i data-lucide="download" style="width: 14px; height: 14px;"></i> Descargar
      </a>
    </div>
    ${buildCounterBadge('ley', l.id)}
  `;
}

function renderAdjuntos(adjuntos, parentId) {
  if (!adjuntos || adjuntos.length === 0) return '';
  return `
    <div class="law-adjuntos">
      <div class="law-adjuntos-title"><i data-lucide="paperclip" style="width: 12px; height: 12px;"></i> Documentos Adjuntos</div>
      ${adjuntos.map(adj => `
        <div class="law-adjunto-item">
          <div class="law-adjunto-icon"><i data-lucide="file-text" style="width: 14px; height: 14px;"></i></div>
          <span class="law-adjunto-name">${escapeHTML(adj.nombre)}</span>
          <div class="law-adjunto-actions">
            <button class="law-adjunto-download" data-preview="${escapeHTML(adj.relative_path)}" data-title="${escapeHTML(adj.nombre)}" data-type="ley" data-id="${parentId}">
              <i data-lucide="eye" style="width: 12px; height: 12px;"></i> Ver
            </button>
            <span class="adjunto-sep">|</span>
            <a href="${escapeHTML(adj.relative_path)}" target="_blank" class="law-adjunto-download" data-track-download="${parentId}" data-track-type="ley">
              <i data-lucide="download" style="width: 12px; height: 12px;"></i> PDF
            </a>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function appendGlobalBanner(grid) {
  const totalDownloads = getTotalDownloads('ley', allLaws);
  const banner = document.createElement('div');
  banner.className = 'global-downloads-banner';
  banner.innerHTML = `
    <div class="global-downloads-icon">📜</div>
    <p class="global-downloads-text">Las Leyes del Estado han sido descargadas <strong id="global-law-count">${totalDownloads}</strong> ${totalDownloads === 1 ? 'vez' : 'veces'}</p>
    <div class="global-downloads-sparkle">⚖️</div>
  `;
  grid.appendChild(banner);
}
