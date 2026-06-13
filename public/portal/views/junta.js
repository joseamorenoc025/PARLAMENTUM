import { allJunta } from '../data.js';
import { showStatus, hideStatus, getDefaultAvatar } from '../ui.js';
import { search } from '../search.js';
import { escapeHTML } from './helpers.js';

export function renderJunta(term) {
  const mainGrid = document.getElementById('main-grid');
  let filtered = allJunta;

  if (term.length >= 2) {
    const results = search('junta', term);
    if (results) {
      filtered = results.map(r => r.item);
      if (results.length === 0) return showStatus('No se encontraron miembros de la Junta Directiva.', 'info');
    }
  } else if (term.length > 0) {
    filtered = allJunta.filter(j =>
      j.nombre.toLowerCase().includes(term) ||
      j.rol.toLowerCase().includes(term) ||
      (j.partido && j.partido.toLowerCase().includes(term))
    );
  }

  if (filtered.length === 0) return showStatus('No se encontraron miembros de la Junta Directiva.', 'info');

  hideStatus();
  filtered.forEach(j => {
    const card = document.createElement('div');
    card.className = 'card legislator-card';
    card.innerHTML = `
      <div class="junta-badge">
        <i data-lucide="crown" class="icon-xxs"></i> Junta Directiva
      </div>
      <img src="${j.foto || getDefaultAvatar()}" onerror="this.onerror=null; this.src='${getDefaultAvatar()}'" class="legislator-img legislator-img-spaced" loading="lazy" alt="${escapeHTML(j.nombre)}">
      <h3 class="legislator-name">${escapeHTML(j.nombre)}</h3>
      <span class="legislator-party">${escapeHTML(j.partido || '')}</span>
      <p class="junta-rol">${escapeHTML(j.rol)}</p>
      <p class="junta-bio">${escapeHTML(j.biografia) || 'Sin descripción biográfica disponible.'}</p>
    `;
    mainGrid.appendChild(card);
  });
}
