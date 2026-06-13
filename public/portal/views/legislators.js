import { allLegislators } from '../data.js';
import { showStatus, hideStatus, getDefaultAvatar } from '../ui.js';
import { search } from '../search.js';
import { trackProfileView } from '../tracking.js';
import { escapeHTML } from './helpers.js';

export function setupLegislatorsFilters(container) {
  const filter = document.createElement('select');
  filter.id = 'filter-party';
  filter.setAttribute('aria-label', 'Filtrar por partido');
  filter.innerHTML = '<option value="">Todos los partidos</option>';
  const parties = [...new Set(allLegislators.map(l => l.partido).filter(Boolean))].sort();
  parties.forEach(p => filter.innerHTML += `<option value="${p}">${p}</option>`);
  container.appendChild(filter);
  return { filter };
}

export function renderLegislators(term) {
  const mainGrid = document.getElementById('main-grid');
  const party = document.getElementById('filter-party')?.value;

  let filtered = allLegislators;

  if (term.length >= 2) {
    const results = search('legislators', term);
    if (results) {
      filtered = results.map(r => r.item);
      if (results.length === 0) { showStatus('No se encontraron legisladores.', 'info'); return; }
    }
  } else if (term.length > 0) {
    filtered = allLegislators.filter(l =>
      l.nombre.toLowerCase().includes(term) ||
      (l.partido && l.partido.toLowerCase().includes(term))
    );
  }

  if (party) filtered = filtered.filter(l => l.partido === party);

  if (filtered.length === 0) { showStatus('No se encontraron legisladores.', 'info'); return; }
  hideStatus();

  filtered.forEach(l => {
    const card = document.createElement('div');
    card.className = 'card legislator-card';
    card.innerHTML = `
      <img src="${l.foto || getDefaultAvatar()}" onerror="this.onerror=null; this.src='${getDefaultAvatar()}'" class="legislator-img" loading="lazy" alt="${escapeHTML(l.nombre)}">
      <h3 class="legislator-name">${escapeHTML(l.nombre)}</h3>
      <span class="legislator-party">${escapeHTML(l.partido || 'Independiente')}</span>
      <button class="btn-primary" data-view-legislator="${l.id}">
        <i data-lucide="user"></i> Ver Perfil
      </button>
    `;
    mainGrid.appendChild(card);
  });
}

export function renderLegislatorProfile(id) {
  const legislator = allLegislators.find(l => String(l.id) === String(id));
  if (!legislator) { showStatus('Legislador no encontrado', 'error'); return; }

  trackProfileView(legislator.nombre);

  const profile = document.getElementById('legislator-profile');
  profile.innerHTML = `
    <button class="btn-primary back-btn" data-view="legislators">
      <i data-lucide="arrow-left"></i> Volver al listado
    </button>
    <div class="profile-header">
      <img src="${legislator.foto || getDefaultAvatar()}" onerror="this.onerror=null; this.src='${getDefaultAvatar()}'" class="profile-img-lg" alt="${escapeHTML(legislator.nombre)}">
      <div class="profile-info">
        <span class="legislator-party">${escapeHTML(legislator.partido || 'Independiente')}</span>
        <h2>${escapeHTML(legislator.nombre)}</h2>
        <div class="profile-bio">${escapeHTML(legislator.biografia) || 'Sin biografía disponible.'}</div>
        <div class="profile-comms">
          <h3>Comisiones y Cargos</h3>
          <div class="comms-grid">
            ${(legislator.comisiones || []).map(c => `
              <div class="comm-tag">
                <span class="comm-name">${escapeHTML(c.nombre)}</span>
                <span class="comm-role">${escapeHTML(c.cargo)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  window.scrollTo(0, 0);
}
