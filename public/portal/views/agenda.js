import { allProjects } from '../data.js';
import { showStatus, hideStatus } from '../ui.js';
import { search } from '../search.js';
import { getDownloadCount, buildCounterBadge } from '../tracking.js';
import { escapeHTML, popularityBadge } from './helpers.js';

const LEGISLATIVE_PHASES = ['Recepción', 'Estudio en Comisión', '1ra Discusión', '2da Discusión', 'Sanción'];

export function setupAgendaFilters(container) {
  const stateSelect = document.createElement('select');
  stateSelect.id = 'filter-state';
  stateSelect.innerHTML = '<option value="">Todos los estados</option><option value="en_comision">En Comisión</option><option value="aprobado">Aprobado</option><option value="rechazado">Rechazado</option>';

  const tagSelect = document.createElement('select');
  tagSelect.id = 'filter-tag';
  tagSelect.innerHTML = '<option value="">Materia / Eje Temático</option>';
  const allTags = new Set();
  allProjects.forEach(p => { if (p.tags) p.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => allTags.add(t)); });
  Array.from(allTags).sort().forEach(t => { tagSelect.innerHTML += `<option value="${t}">#${t}</option>`; });

  container.appendChild(stateSelect);
  container.appendChild(tagSelect);
  return { stateSelect, tagSelect };
}

export function renderAgenda(term, renderCurrentView) {
  const mainGrid = document.getElementById('main-grid');
  const state = document.getElementById('filter-state')?.value;
  const selectedTag = document.getElementById('filter-tag')?.value;

  let filtered = allProjects;

  if (term.length >= 2) {
    const results = search('agenda', term);
    if (results) {
      filtered = results.map(r => r.item);
      if (results.length === 0) { showStatus('No hay proyectos en la agenda.', 'info'); return; }
    }
  } else if (term.length > 0) {
    filtered = allProjects.filter(p =>
      p.titulo.toLowerCase().includes(term) ||
      (p.expediente && p.expediente.toLowerCase().includes(term)) ||
      (p.tags && p.tags.toLowerCase().includes(term))
    );
  }

  filtered = filtered.filter(p => {
    return (!state || p.estado === state) &&
      (!selectedTag || (p.tags && p.tags.split(',').map(t => t.trim().toLowerCase()).includes(selectedTag.toLowerCase())));
  });

  if (filtered.length === 0) { showStatus('No hay proyectos en la agenda.', 'info'); return; }
  hideStatus();

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';

    const localDl = getDownloadCount('proyecto', p.id);
    const totalDl = localDl + (p.descargas || 0);

    card.innerHTML = `
      <div class="card-header-row">
        <div class="card-header-left">
          <span class="status-tag status-${p.estado}">${(p.estado || '').replace('_', ' ')}</span>
          ${popularityBadge(totalDl)}
        </div>
        ${buildCounterBadge('proyecto', p.id)}
      </div>
      <h3 class="law-title">${escapeHTML(p.titulo)}</h3>
      <p class="law-extracto">${escapeHTML(p.extracto) || ''}</p>
      <div class="law-meta">
        <span class="meta-item"><i data-lucide="user" style="width:12px"></i> ${escapeHTML(p.ponente || '')}</span>
        <span class="meta-item"><i data-lucide="users" style="width:12px"></i> ${escapeHTML(p.comision || '')}</span>
      </div>
      ${renderTags(p.tags, renderCurrentView)}
      ${buildPhaseTimeline(p)}
    `;
    mainGrid.appendChild(card);
  });
}

function renderTags(tagsStr, renderCurrentView) {
  if (!tagsStr) return '';
  const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
  if (tags.length === 0) return '';
  return `<div class="tag-badges-container">${tags.map(t => `<span class="tag-badge-clickable" data-tag="${escapeHTML(t)}">#${escapeHTML(t)}</span>`).join('')}</div>`;
}

function buildPhaseTimeline(project) {
  const adjuntos = project.adjuntos || [];
  const currentPhase = project.fase_actual || '';
  const phaseDocMap = {};
  adjuntos.forEach(adj => { phaseDocMap[adj.fase] = adj; });
  const extraAdjuntos = adjuntos.filter(adj => !LEGISLATIVE_PHASES.includes(adj.fase));

  const nodesHtml = LEGISLATIVE_PHASES.map(phase => {
    const doc = phaseDocMap[phase];
    const isCurrent = phase === currentPhase;
    const hasDoc = !!doc;
    let classes = 'phase-node';
    if (isCurrent) classes += ' phase-current';
    if (hasDoc) classes += ' phase-has-doc';

    const docBtn = hasDoc
      ? `<div class="phase-doc-btns">
          <button class="phase-doc-btn" data-preview="${escapeHTML(doc.relative_path)}" data-title="${escapeHTML(doc.nombre || phase)}" data-type="proyecto" data-id="${project.id}"><i data-lucide="eye" style="width: 8px; height: 8px;"></i> Ver</button>
          <a href="${escapeHTML(doc.relative_path)}" target="_blank" class="phase-doc-btn" data-track-download="${project.id}" data-track-type="proyecto"><i data-lucide="download" style="width: 8px; height: 8px;"></i> PDF</a>
         </div>`
      : '';

    return `<div class="${classes}"><span class="phase-node-label">${phase}</span>${docBtn}</div>`;
  }).join('');

  const extraHtml = extraAdjuntos.map(adj => `
    <div class="phase-node phase-has-doc">
      <span class="phase-node-label">${escapeHTML(adj.fase)}</span>
      <div class="phase-doc-btns">
        <button class="phase-doc-btn" data-preview="${escapeHTML(adj.relative_path)}" data-title="${escapeHTML(adj.nombre)}" data-type="proyecto" data-id="${project.id}"><i data-lucide="eye" style="width: 8px; height: 8px;"></i> Ver</button>
        <a href="${escapeHTML(adj.relative_path)}" target="_blank" class="phase-doc-btn" data-track-download="${project.id}" data-track-type="proyecto"><i data-lucide="download" style="width: 8px; height: 8px;"></i> PDF</a>
      </div>
    </div>
  `).join('');

  return `
    <div class="phase-timeline">
      <div class="phase-timeline-title"><i data-lucide="git-branch" style="width: 12px; height: 12px;"></i> Trámite Legislativo</div>
      <div class="phase-timeline-list">${nodesHtml}${extraHtml}</div>
    </div>
  `;
}
