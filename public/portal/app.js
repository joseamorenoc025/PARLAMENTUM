import { fetchConfig, fetchLaws, fetchProjects, fetchLegislators, fetchJunta, allLaws, allProjects, allLegislators } from './data.js';
import { initSearch } from './search.js';
import { trackSearch } from './tracking.js';
import { applyConfig, showStatus, hideStatus } from './ui.js';
import { renderJunta } from './views/junta.js';
import { renderLaws, setupLawsFilters } from './views/laws.js';
import { renderAgenda, setupAgendaFilters } from './views/agenda.js';
import { renderLegislators, renderLegislatorProfile, setupLegislatorsFilters } from './views/legislators.js';
import { renderStatsDashboard } from './views/stats.js';
import { openPdfPreview, closePdfPreview } from './pdf-viewer.js';
import { trackDownload } from './tracking.js';

let currentView = 'junta';
let searchDebounce = null;

export function renderCurrentView() {
  const term = document.getElementById('search-input').value.toLowerCase();
  const grid = document.getElementById('main-grid');
  grid.innerHTML = '';
  hideStatus();

  switch (currentView) {
    case 'junta': renderJunta(term); break;
    case 'laws': renderLaws(term, renderCurrentView); break;
    case 'agenda': renderAgenda(term, renderCurrentView); break;
    case 'legislators': renderLegislators(term); break;
  }
  if (window.lucide) window.lucide.createIcons();
}

export async function switchView(view, id = null) {
  currentView = view;

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  const isStats = view === 'stats';
  const isProfile = view === 'profile';

  document.getElementById('main-grid').classList.toggle('hidden', isProfile || isStats);
  document.getElementById('legislator-profile').classList.toggle('hidden', !isProfile);
  document.getElementById('stats-dashboard').classList.toggle('hidden', !isStats);
  document.getElementById('search-section').classList.toggle('hidden', isProfile || isStats);

  if (view === 'profile') {
    renderLegislatorProfile(id);
    return;
  }
  if (view === 'stats') {
    await Promise.all([fetchLaws(), fetchProjects()]);
    initSearch();
    renderStatsDashboard();
    return;
  }

  if (view === 'junta' && allJunta.length === 0) await fetchJunta();
  if (view === 'legislators' && allLegislators.length === 0) await fetchLegislators();
  if (view === 'laws' && allLaws.length === 0) await fetchLaws();
  if (view === 'agenda' && allProjects.length === 0) await fetchProjects();

  initSearch();
  setupFilters();
  renderCurrentView();
}

function setupFilters() {
  const container = document.getElementById('filters-container');
  container.innerHTML = '';

  let filters;
  switch (currentView) {
    case 'laws': filters = setupLawsFilters(container); break;
    case 'agenda': filters = setupAgendaFilters(container); break;
    case 'legislators': filters = setupLegislatorsFilters(container); break;
  }

  if (filters) {
    Object.values(filters).forEach(el => {
      el.addEventListener('change', () => renderCurrentView());
    });
  }
}

// Event delegation for interactive elements
function setupEventDelegation() {
  document.addEventListener('click', (e) => {
    // Legislator profile buttons
    const legBtn = e.target.closest('[data-view-legislator]');
    if (legBtn) { e.preventDefault(); switchView('profile', legBtn.dataset.viewLegislator); return; }

    // View switcher buttons
    const viewBtn = e.target.closest('[data-view]');
    if (viewBtn && !viewBtn.classList.contains('nav-btn')) {
      e.preventDefault(); switchView(viewBtn.dataset.view); return; }

    // PDF preview buttons
    const previewBtn = e.target.closest('[data-preview]');
    if (previewBtn) {
      e.preventDefault();
      openPdfPreview(previewBtn.dataset.preview, previewBtn.dataset.title, previewBtn.dataset.type, previewBtn.dataset.id);
      return;
    }

    // Track download
    const downloadLink = e.target.closest('[data-track-download]');
    if (downloadLink) {
      const title = downloadLink.dataset.title || downloadLink.closest('.card')?.querySelector('.law-title')?.textContent || 'Documento';
      trackDownload(title, downloadLink.dataset.trackType || 'documento', downloadLink.dataset.trackDownload);
    }

    // Tag filter click
    const tag = e.target.closest('[data-tag]');
    if (tag) {
      const select = document.getElementById('filter-tag');
      if (select) { select.value = tag.dataset.tag; renderCurrentView(); }
    }

    // Clear search
    const clearBtn = e.target.closest('[data-clear-search]');
    if (clearBtn) { document.getElementById('search-input').value = ''; renderCurrentView(); return; }
  });
}

// Theme toggle
function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  const moon = document.getElementById('theme-icon-moon');
  const sun = document.getElementById('theme-icon-sun');
  const html = document.documentElement;

  const updateIcons = () => {
    const isDark = html.getAttribute('data-theme') === 'dark';
    moon.style.display = isDark ? 'none' : 'block';
    sun.style.display = isDark ? 'block' : 'none';
  };
  updateIcons();

  toggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('portal-theme', next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0f172a' : '#4f46e5');
    updateIcons();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await fetchConfig();
  applyConfig();
  if (window.lucide) window.lucide.createIcons();

  setupEventDelegation();

  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Search with debounce
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', () => {
    renderCurrentView();
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      if (searchInput.value.trim().length >= 2) trackSearch(searchInput.value.trim());
    }, 1000);
  });

  // Routing
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const view = params.get('view');
  const query = params.get('q');
  if (query) searchInput.value = query;
  if (id) switchView('profile', id);
  else if (view) switchView(view);
  else switchView('junta');
});
