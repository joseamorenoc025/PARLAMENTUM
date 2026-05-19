/**
 * Portal Ciudadano - PARLAMENTUM
 * Core logic for Laws, Agenda, and Legislators
 */

let allLaws = [];
let allProjects = [];
let allLegislators = [];
let allJunta = [];
let appConfig = {
    chamber_name: 'PARLAMENTUM',
    timezone: 'UTC'
};

let currentView = 'junta'; // 'laws', 'agenda', 'legislators', 'profile', 'junta'

const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiLz48cGF0aCBkPSJNMTIgMTJjLTIuNjcgMC04IDEuMzQtOCA0djJoMTZ2LTJjMC0yLjY2LTUuMzMtNC04LTR6bTAtMmEzIDMgMCAxIDAgMC02IDMgMyAwIDAgMCAwIDZ6IiBmaWxsPSIjNjQ3NDhiIi8+PC9zdmc+';

/**
 * Download Counter - localStorage based tracking
 */
function getDownloadCount(entityType, entityId) {
    const key = `dl_${entityType}_${entityId}`;
    return parseInt(localStorage.getItem(key) || '0');
}

function incrementDownload(entityType, entityId) {
    const key = `dl_${entityType}_${entityId}`;
    const count = getDownloadCount(entityType, entityId) + 1;
    localStorage.setItem(key, String(count));
    // Update individual badge in DOM
    const badge = document.getElementById(`dl-badge-${entityType}-${entityId}`);
    if (badge) {
        badge.textContent = `${count}`;
        badge.closest('.download-counter').classList.add('has-downloads');
    }
    // Update global law counter if applicable
    if (entityType === 'ley') {
        const globalCount = document.getElementById('global-law-count');
        if (globalCount) {
            const newTotal = getTotalDownloads('ley', allLaws);
            globalCount.textContent = newTotal;
        }
    }
    return count;
}

function buildCounterBadge(entityType, entityId) {
    const count = getDownloadCount(entityType, entityId);
    const hasClass = count > 0 ? ' has-downloads' : '';
    return `<div class="download-counter${hasClass}"><i data-lucide="arrow-down-to-line" style="width: 11px; height: 11px;"></i> <span id="dl-badge-${entityType}-${entityId}">${count}</span></div>`;
}

function getTotalDownloads(entityType, items) {
    let total = 0;
    items.forEach(item => {
        total += getDownloadCount(entityType, item.id);
    });
    return total;
}

// Expose for inline onclick
window.incrementDownload = incrementDownload;

// DOM Elements
const mainGrid = document.getElementById('main-grid');
const legislatorProfile = document.getElementById('legislator-profile');
const searchInput = document.getElementById('search-input');
const filtersContainer = document.getElementById('filters-container');
const chamberNameDisplay = document.getElementById('chamber-name-display');
const lastUpdateSpan = document.getElementById('last-update');
const statusMessage = document.getElementById('status-message');
const institutionalLogo = document.getElementById('institutional-logo');

/**
 * Initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial Config
    await fetchConfig();
    lucide.createIcons();

    // 2. Routing Logic
    handleRouting();

    // 3. Setup Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });

    // 4. Search Handler
    searchInput.addEventListener('input', () => {
        renderCurrentView();
    });
});

/**
 * Routing Handler
 */
function handleRouting() {
    const params = new URLSearchParams(window.location.search);
    const legislatorId = params.get('id');
    const view = params.get('view');
    const query = params.get('q');

    if (query) {
        searchInput.value = query;
    }

    if (legislatorId) {
        switchView('profile', legislatorId);
    } else if (view) {
        switchView(view);
    } else {
        switchView('junta');
    }
}

/**
 * View Switcher
 */
async function switchView(view, id = null) {
    currentView = view;
    
    // Update Nav UI
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    const isStats = view === 'stats';
    const isProfile = view === 'profile';

    // Toggle Containers
    mainGrid.classList.toggle('hidden', isProfile || isStats);
    legislatorProfile.classList.toggle('hidden', !isProfile);
    document.getElementById('stats-dashboard').classList.toggle('hidden', !isStats);
    document.getElementById('search-section').classList.toggle('hidden', isProfile || isStats);

    // Load Data and Render
    if (view === 'junta') {
        if (allJunta.length === 0) await fetchJunta();
        setupFilters('junta');
    } else if (view === 'laws') {
        if (allLaws.length === 0) await fetchLaws();
        setupFilters('laws');
    } else if (view === 'agenda') {
        if (allProjects.length === 0) await fetchProjects();
        setupFilters('agenda');
    } else if (view === 'legislators') {
        if (allLegislators.length === 0) await fetchLegislators();
        setupFilters('legislators');
    } else if (view === 'profile') {
        if (allLegislators.length === 0) await fetchLegislators();
        renderLegislatorProfile(id);
        return;
    } else if (view === 'stats') {
        if (allLaws.length === 0) await fetchLaws();
        if (allProjects.length === 0) await fetchProjects();
        if (allLegislators.length === 0) await fetchLegislators();
        renderStatsDashboard();
        return;
    }

    renderCurrentView();
}

/**
 * Data Fetching
 */
async function fetchConfig() {
    try {
        const response = await fetch(`./config.json?t=${Date.now()}`);
        if (response.ok) {
            appConfig = await response.json();
            applyConfig();
        }
    } catch (e) { console.warn('Config default used'); }
}

async function fetchJunta() {
    try {
        const response = await fetch(`./junta_directiva.json?t=${Date.now()}`);
        allJunta = response.ok ? await response.json() : [];
    } catch (e) { console.error('Error junta', e); }
}

async function fetchLaws() {
    try {
        const response = await fetch(`./leyes.json?t=${Date.now()}`);
        allLaws = response.ok ? await response.json() : [];
        allLaws.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } catch (e) { console.error('Error laws', e); }
}

async function fetchProjects() {
    try {
        const response = await fetch(`./proyectos.json?t=${Date.now()}`);
        allProjects = response.ok ? await response.json() : [];
    } catch (e) { console.error('Error agenda', e); }
}

async function fetchLegislators() {
    try {
        const response = await fetch(`./legisladores.json?t=${Date.now()}`);
        allLegislators = response.ok ? await response.json() : [];
    } catch (e) { console.error('Error legislators', e); }
}

/**
 * Filter Setup
 */
function setupFilters(view) {
    filtersContainer.innerHTML = '';
    
    if (view === 'laws') {
        const yearSelect = document.createElement('select');
        yearSelect.id = 'filter-year';
        yearSelect.innerHTML = '<option value="">Todos los años</option>';
        const years = [...new Set(allLaws.map(l => l.anio))].sort((a,b) => b-a);
        years.forEach(y => yearSelect.innerHTML += `<option value="${y}">${y}</option>`);
        
        const typeSelect = document.createElement('select');
        typeSelect.id = 'filter-type';
        typeSelect.innerHTML = '<option value="">Gaceta: Todas</option><option value="Ordinaria">Ordinaria</option><option value="Extraordinaria">Extraordinaria</option>';
        
        const tagSelect = document.createElement('select');
        tagSelect.id = 'filter-tag';
        tagSelect.innerHTML = '<option value="">Materia / Eje Temático</option>';
        
        const allTags = new Set();
        allLaws.forEach(l => {
            if (l.tags) {
                l.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => allTags.add(t));
            }
        });
        Array.from(allTags).sort().forEach(t => {
            tagSelect.innerHTML += `<option value="${t}">#${t}</option>`;
        });

        filtersContainer.appendChild(yearSelect);
        filtersContainer.appendChild(typeSelect);
        filtersContainer.appendChild(tagSelect);
        
        yearSelect.addEventListener('change', renderCurrentView);
        typeSelect.addEventListener('change', renderCurrentView);
        tagSelect.addEventListener('change', renderCurrentView);
    } else if (view === 'agenda') {
        const stateSelect = document.createElement('select');
        stateSelect.id = 'filter-state';
        stateSelect.innerHTML = '<option value="">Todos los estados</option><option value="en_comision">En Comisión</option><option value="aprobado">Aprobado</option><option value="rechazado">Rechazado</option>';
        
        const tagSelect = document.createElement('select');
        tagSelect.id = 'filter-tag';
        tagSelect.innerHTML = '<option value="">Materia / Eje Temático</option>';
        
        const allTags = new Set();
        allProjects.forEach(p => {
            if (p.tags) {
                p.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => allTags.add(t));
            }
        });
        Array.from(allTags).sort().forEach(t => {
            tagSelect.innerHTML += `<option value="${t}">#${t}</option>`;
        });

        filtersContainer.appendChild(stateSelect);
        filtersContainer.appendChild(tagSelect);
        
        stateSelect.addEventListener('change', renderCurrentView);
        tagSelect.addEventListener('change', renderCurrentView);
    }
}

/**
 * Rendering Logic
 */
function renderCurrentView() {
    const term = searchInput.value.toLowerCase();
    mainGrid.innerHTML = '';
    hideStatus();

    if (currentView === 'junta') renderJunta(term);
    else if (currentView === 'laws') renderLaws(term);
    else if (currentView === 'agenda') renderAgenda(term);
    else if (currentView === 'legislators') renderLegislators(term);
    
    lucide.createIcons();
}

function renderJunta(term) {
    const filtered = allJunta.filter(j => j.nombre.toLowerCase().includes(term) || j.rol.toLowerCase().includes(term) || (j.partido && j.partido.toLowerCase().includes(term)));
    
    if (filtered.length === 0) return showStatus('No se encontraron miembros de la Junta Directiva.', 'info');
    
    filtered.forEach(j => {
        const card = document.createElement('div');
        card.className = 'card legislator-card';
        card.innerHTML = `
            <div style="position:absolute; top: 1rem; right: 1rem; background: #fbbf24; color: #78350f; font-weight: 900; font-size: 0.65rem; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 4px; z-index: 10;">
                <i data-lucide="crown" style="width: 10px; height: 10px;"></i> Junta Directiva
            </div>
            <img src="${j.foto || defaultAvatar}" onerror="this.onerror=null; this.src=defaultAvatar;" class="legislator-img" style="margin-top: 1rem;">
            <h3 class="legislator-name">${j.nombre}</h3>
            <span class="legislator-party" style="background: #e0e7ff; color: #4f46e5; font-weight: bold; border-radius: 6px; padding: 2px 8px; font-size: 0.65rem; margin-top: 0.25rem;">${j.partido}</span>
            <p style="font-size: 0.8rem; font-weight: 800; color: #374151; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 0.025em;">${j.rol}</p>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0.5rem 1rem 0 1rem; line-height: 1.4;">${j.biografia || 'Sin descripción biográfica disponible.'}</p>
        `;
        mainGrid.appendChild(card);
    });
}

function renderLaws(term) {
    const year = document.getElementById('filter-year')?.value;
    const type = document.getElementById('filter-type')?.value;
    const selectedTag = document.getElementById('filter-tag')?.value;

    const filtered = allLaws.filter(l => {
        const matchTerm = l.titulo.toLowerCase().includes(term) || 
                          (l.expediente && l.expediente.toLowerCase().includes(term)) ||
                          (l.tags && l.tags.toLowerCase().includes(term));
        const matchYear = !year || String(l.anio) === year;
        const lawType = l.gaceta || l.tipo || 'Ordinaria';
        const matchType = !type || lawType === type;
        const matchTag = !selectedTag || (l.tags && l.tags.split(',').map(t => t.trim().toLowerCase()).includes(selectedTag.toLowerCase()));
        return matchTerm && matchYear && matchType && matchTag;
    });

    if (filtered.length === 0) return showStatus('No se encontraron leyes.', 'info');

    filtered.forEach(l => {
        const card = document.createElement('div');
        card.className = 'card';
        
        let downloadBtnHtml = '';
        if (l.link_drive) {
            downloadBtnHtml = `
                <a href="${l.link_drive}" target="_blank" class="btn-primary" style="margin-bottom: 0.5rem;" onclick="incrementDownload('ley', ${l.id})">
                    <i data-lucide="download"></i> Descargar Ley
                </a>
                ${buildCounterBadge('ley', l.id)}
            `;
        }

        let adjuntosHtml = '';
        if (l.adjuntos && l.adjuntos.length > 0) {
            adjuntosHtml = `
                <div class="law-adjuntos">
                    <div class="law-adjuntos-title"><i data-lucide="paperclip" style="width: 12px; height: 12px;"></i> Documentos Adjuntos</div>
                    ${l.adjuntos.map(adj => `
                        <div class="law-adjunto-item">
                            <div class="law-adjunto-icon"><i data-lucide="file-text" style="width: 14px; height: 14px;"></i></div>
                            <span class="law-adjunto-name" title="${adj.nombre}">${adj.nombre}</span>
                            <a href="${adj.relative_path}" target="_blank" class="law-adjunto-download" onclick="incrementDownload('ley', ${l.id})">
                                <i data-lucide="download" style="width: 12px; height: 12px;"></i> PDF
                            </a>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        let tagsHtml = '';
        if (l.tags) {
            tagsHtml = `
                <div class="tag-badges-container" style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; border-top: 1px solid #f3f4f6; padding-top: 0.75rem;">
                    ${l.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => `
                        <span class="badge tag-badge-clickable" style="font-size: 0.65rem; font-weight: 700; background: #e0e7ff; color: #4f46e5; padding: 2px 8px; border-radius: 9999px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#4f46e5'; this.style.color='white'" onmouseout="this.style.background='#e0e7ff'; this.style.color='#4f46e5'" onclick="setTagFilter('${tag}')">#${tag}</span>
                    `).join('')}
                </div>
            `;
        }

        card.innerHTML = `
            <span class="law-tag">${l.gaceta || l.tipo || 'Ordinaria'}</span>
            <h3 class="law-title">${l.titulo}</h3>
            <div class="law-meta" style="margin-bottom: 1rem;">
                <div class="meta-item"><i data-lucide="file-text" style="width:12px"></i> ${l.expediente || 'No asignado'}</div>
                <div class="meta-item"><i data-lucide="calendar" style="width:12px"></i> ${l.anio || 'N/A'}</div>
            </div>
            ${tagsHtml}
            ${downloadBtnHtml}
            ${adjuntosHtml}
        `;
        mainGrid.appendChild(card);
    });

    // Global download counter banner for laws
    const totalDownloads = getTotalDownloads('ley', allLaws);
    const globalBanner = document.createElement('div');
    globalBanner.className = 'global-downloads-banner';
    globalBanner.innerHTML = `
        <div class="global-downloads-icon">📜</div>
        <p class="global-downloads-text">Las Leyes del Estado han sido descargadas <strong id="global-law-count">${totalDownloads}</strong> ${totalDownloads === 1 ? 'vez' : 'veces'}</p>
        <div class="global-downloads-sparkle">⚖️</div>
    `;
    mainGrid.appendChild(globalBanner);
}

/**
 * Builds a visual phase timeline for a legislative project
 */
const LEGISLATIVE_PHASES = [
    'Recepción',
    'Estudio en Comisión',
    '1ra Discusión',
    '2da Discusión',
    'Sanción'
];

function buildPhaseTimeline(project) {
    const adjuntos = project.adjuntos || [];
    const currentPhase = project.fase_actual || '';
    
    // Build a map of phase -> adjunto for quick lookup
    const phaseDocMap = {};
    adjuntos.forEach(adj => {
        phaseDocMap[adj.fase] = adj;
    });

    // Check if there are adjuntos with phases not in the standard list
    const extraAdjuntos = adjuntos.filter(adj => !LEGISLATIVE_PHASES.includes(adj.fase));

    const nodesHtml = LEGISLATIVE_PHASES.map(phase => {
        const doc = phaseDocMap[phase];
        const isCurrent = phase === currentPhase;
        const hasDoc = !!doc;
        
        let classes = 'phase-node';
        if (isCurrent) classes += ' phase-current';
        if (hasDoc) classes += ' phase-has-doc';

        const docBtn = hasDoc 
            ? `<a href="${doc.relative_path}" target="_blank" class="phase-doc-btn" onclick="incrementDownload('proyecto', ${project.id})"><i data-lucide="download" style="width: 10px; height: 10px;"></i> PDF</a>`
            : '';

        return `<div class="${classes}"><span class="phase-node-label">${phase}</span>${docBtn}</div>`;
    }).join('');

    // Render extra (non-standard) adjuntos if any
    let extraHtml = '';
    if (extraAdjuntos.length > 0) {
        extraHtml = extraAdjuntos.map(adj => `
            <div class="phase-node phase-has-doc">
                <span class="phase-node-label">${adj.fase}</span>
                <a href="${adj.relative_path}" target="_blank" class="phase-doc-btn" onclick="incrementDownload('proyecto', ${project.id})"><i data-lucide="download" style="width: 10px; height: 10px;"></i> PDF</a>
            </div>
        `).join('');
    }

    return `
        <div class="phase-timeline">
            <div class="phase-timeline-title"><i data-lucide="git-branch" style="width: 12px; height: 12px;"></i> Trámite Legislativo</div>
            <div class="phase-timeline-list">
                ${nodesHtml}
                ${extraHtml}
            </div>
        </div>
    `;
}

function renderAgenda(term) {
    const state = document.getElementById('filter-state')?.value;
    const selectedTag = document.getElementById('filter-tag')?.value;

    const filtered = allProjects.filter(p => {
        const matchTerm = p.titulo.toLowerCase().includes(term) || 
                          (p.expediente && p.expediente.toLowerCase().includes(term)) ||
                          (p.tags && p.tags.toLowerCase().includes(term));
        const matchState = !state || p.estado === state;
        const matchTag = !selectedTag || (p.tags && p.tags.split(',').map(t => t.trim().toLowerCase()).includes(selectedTag.toLowerCase()));
        return matchTerm && matchState && matchTag;
    });

    if (filtered.length === 0) return showStatus('No hay proyectos en la agenda.', 'info');

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';

        const timelineHtml = buildPhaseTimeline(p);

        let tagsHtml = '';
        if (p.tags) {
            tagsHtml = `
                <div class="tag-badges-container" style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; border-top: 1px solid #f3f4f6; padding-top: 0.75rem;">
                    ${p.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => `
                        <span class="badge tag-badge-clickable" style="font-size: 0.65rem; font-weight: 700; background: #e0e7ff; color: #4f46e5; padding: 2px 8px; border-radius: 9999px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#4f46e5'; this.style.color='white'" onmouseout="this.style.background='#e0e7ff'; this.style.color='#4f46e5'" onclick="setTagFilter('${tag}')">#${tag}</span>
                    `).join('')}
                </div>
            `;
        }

        const counterBadge = buildCounterBadge('proyecto', p.id);

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span class="status-tag status-${p.estado}">${p.estado.replace('_', ' ')}</span>
                ${counterBadge}
            </div>
            <h3 class="law-title">${p.titulo}</h3>
            <p class="law-meta" style="margin-bottom:1rem">${p.extracto || ''}</p>
            <div class="law-meta" style="margin-bottom: 1rem;">
                <div class="meta-item"><i data-lucide="user" style="width:12px"></i> ${p.ponente}</div>
                <div class="meta-item"><i data-lucide="users" style="width:12px"></i> ${p.comision}</div>
            </div>
            ${tagsHtml}
            ${timelineHtml}
        `;
        mainGrid.appendChild(card);
    });
}

function renderLegislators(term) {
    const filtered = allLegislators.filter(l => l.nombre.toLowerCase().includes(term) || (l.partido && l.partido.toLowerCase().includes(term)));

    if (filtered.length === 0) return showStatus('No se encontraron legisladores.', 'info');

    filtered.forEach(l => {
        const card = document.createElement('div');
        card.className = 'card legislator-card';
        card.innerHTML = `
            <img src="${l.foto || defaultAvatar}" onerror="this.onerror=null; this.src=defaultAvatar;" class="legislator-img">
            <h3 class="legislator-name">${l.nombre}</h3>
            <span class="legislator-party">${l.partido || 'Independiente'}</span>
            <button class="btn-primary" onclick="switchView('profile', ${l.id})">
                <i data-lucide="user"></i> Ver Perfil
            </button>
        `;
        mainGrid.appendChild(card);
    });
}

/**
 * Legislator Profile (Know your Legislator)
 */
function renderLegislatorProfile(id) {
    const legislator = allLegislators.find(l => String(l.id) === String(id));
    if (!legislator) return showStatus('Legislador no encontrado', 'error');

    legislatorProfile.innerHTML = `
        <button class="btn-primary back-btn" onclick="switchView('legislators')">
            <i data-lucide="arrow-left"></i> Volver al listado
        </button>
        <div class="profile-header">
            <img src="${legislator.foto || defaultAvatar}" onerror="this.onerror=null; this.src=defaultAvatar;" class="profile-img-lg">
            <div class="profile-info">
                <span class="legislator-party">${legislator.partido || 'Independiente'}</span>
                <h2>${legislator.nombre}</h2>
                <div class="profile-bio">${legislator.biografia || 'Sin biografía disponible.'}</div>
                
                <div class="profile-comms">
                    <h3>Comisiones y Cargos</h3>
                    <div class="comms-grid">
                        ${legislator.comisiones.map(c => `
                            <div class="comm-tag">
                                <span class="comm-name">${c.nombre}</span>
                                <span class="comm-role">${c.cargo}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
    window.scrollTo(0, 0);
}

/**
 * Config & UI Helpers
 */
function applyConfig() {
    chamberNameDisplay.textContent = appConfig.chamber_name;
    document.getElementById('footer-chamber-name').textContent = appConfig.chamber_name;
    if (institutionalLogo) {
        const img = new Image();
        img.onload = () => institutionalLogo.src = './assets/logo-institucional.png';
        img.src = './assets/logo-institucional.png';
    }
}

function showStatus(msg, type) {
    statusMessage.textContent = msg;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove('hidden');
}

function hideStatus() {
    statusMessage.classList.add('hidden');
}

/**
 * Clickable tag badge search filter handler
 */
window.setTagFilter = function(tag) {
    const select = document.getElementById('filter-tag');
    if (select) {
        select.value = tag;
        renderCurrentView();
    }
};

/**
 * Renders the Visual Statistics / Analytics Dashboard
 */
function renderStatsDashboard() {
    const statsDashboard = document.getElementById('stats-dashboard');
    statsDashboard.innerHTML = '';

    // 1. Calculations
    const totalLaws = allLaws.length;
    const activeProjects = allProjects.filter(p => p.estado !== 'aprobado' && p.estado !== 'rechazado').length;
    const approvedProjects = allProjects.filter(p => p.estado === 'aprobado').length;
    const totalProjects = allProjects.length;
    const efficiencyRate = totalProjects > 0 ? Math.round((approvedProjects / totalProjects) * 100) : 0;

    // Laws passed per year
    const lawsByYear = {};
    allLaws.forEach(l => {
        if (l.anio) {
            lawsByYear[l.anio] = (lawsByYear[l.anio] || 0) + 1;
        }
    });

    // Projects per phase
    const projectsByPhase = {};
    allProjects.forEach(p => {
        const phase = p.fase_actual || 'Estudio en Comisión';
        projectsByPhase[phase] = (projectsByPhase[phase] || 0) + 1;
    });

    const maxLawsCount = Math.max(...Object.values(lawsByYear), 1);
    const maxProjectsCount = Math.max(...Object.values(projectsByPhase), 1);

    const lawsBarsHtml = Object.keys(lawsByYear).sort((a,b) => b-a).map((year, index) => {
        const count = lawsByYear[year];
        const percentage = Math.round((count / maxLawsCount) * 100);
        const hue = 240 + (index * 15) % 80; 
        return `
            <div class="chart-bar-item">
                <div class="chart-bar-label">
                    <span>Año ${year}</span>
                    <span>${count} ${count === 1 ? 'Ley' : 'Leyes'}</span>
                </div>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill" data-width="${percentage}%" style="background: hsl(${hue}, 70%, 60%);"></div>
                </div>
            </div>
        `;
    }).join('');

    const projectsBarsHtml = Object.keys(projectsByPhase).sort((a,b) => projectsByPhase[b] - projectsByPhase[a]).map((phase, index) => {
        const count = projectsByPhase[phase];
        const percentage = Math.round((count / maxProjectsCount) * 100);
        const hue = 140 + (index * 25) % 100; 
        return `
            <div class="chart-bar-item">
                <div class="chart-bar-label">
                    <span>${phase}</span>
                    <span>${count} ${count === 1 ? 'Proyecto' : 'Proyectos'}</span>
                </div>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill" data-width="${percentage}%" style="background: hsl(${hue}, 70%, 50%);"></div>
                </div>
            </div>
        `;
    }).join('');

    // Generate Layout
    statsDashboard.innerHTML = `
        <div class="stats-header">
            <h2>Estadísticas Legislativas</h2>
            <p>Monitoreo en tiempo real de la productividad legislativa, leyes aprobadas y trámites en curso.</p>
        </div>

        <!-- KPI Counters Grid -->
        <div class="stats-grid">
            <div class="stat-counter-card">
                <div class="stat-counter-icon" style="background: #e0e7ff; color: #4f46e5;">
                    <i data-lucide="scale" style="width: 24px; height: 24px;"></i>
                </div>
                <div class="stat-counter-info">
                    <h3>Leyes Aprobadas</h3>
                    <div class="stat-value">${totalLaws}</div>
                </div>
            </div>

            <div class="stat-counter-card">
                <div class="stat-counter-icon" style="background: #fffbeb; color: #d97706;">
                    <i data-lucide="calendar" style="width: 24px; height: 24px;"></i>
                </div>
                <div class="stat-counter-info">
                    <h3>En Debate Activo</h3>
                    <div class="stat-value">${activeProjects}</div>
                </div>
            </div>



            <div class="stat-counter-card">
                <div class="stat-counter-icon" style="background: #eff6ff; color: #2563eb;">
                    <i data-lucide="trending-up" style="width: 24px; height: 24px;"></i>
                </div>
                <div class="stat-counter-info">
                    <h3>Eficiencia de Aprobación</h3>
                    <div class="stat-value">${efficiencyRate}%</div>
                </div>
            </div>
        </div>

        <!-- Charts Row -->
        <div class="stats-charts-row">
            <div class="chart-card">
                <h3><i data-lucide="bar-chart" style="color: #4f46e5; width: 18px; height: 18px;"></i> Histórico de Leyes Aprobadas</h3>
                <div class="chart-bars">
                    ${totalLaws > 0 ? lawsBarsHtml : '<p style="font-size: 0.85rem; color: #94a3b8; text-align: center; padding: 2rem 0;">No hay registro histórico de leyes.</p>'}
                </div>
            </div>

            <div class="chart-card">
                <h3><i data-lucide="pie-chart" style="color: #10b981; width: 18px; height: 18px;"></i> Proyectos por Fase del Proceso</h3>
                <div class="chart-bars">
                    ${totalProjects > 0 ? projectsBarsHtml : '<p style="font-size: 0.85rem; color: #94a3b8; text-align: center; padding: 2rem 0;">No hay proyectos registrados en la agenda.</p>'}
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();

    // Trigger smooth bar-width animations after DOM update
    setTimeout(() => {
        statsDashboard.querySelectorAll('.chart-bar-fill').forEach(fill => {
            fill.style.width = fill.getAttribute('data-width');
        });
    }, 100);
}
