/**
 * Portal Ciudadano - Segundo Cerebro Legislativo
 * Core logic for Laws, Agenda, and Legislators
 */

let allLaws = [];
let allProjects = [];
let allLegislators = [];
let appConfig = {
    chamber_name: 'Cerebro Legislativo',
    timezone: 'UTC'
};

let currentView = 'laws'; // 'laws', 'agenda', 'legislators', 'profile'

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
        switchView('laws');
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

    // Toggle Containers
    mainGrid.classList.toggle('hidden', view === 'profile');
    legislatorProfile.classList.toggle('hidden', view !== 'profile');
    document.getElementById('search-section').classList.toggle('hidden', view === 'profile');

    // Load Data and Render
    if (view === 'laws') {
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
    }

    renderCurrentView();
}

/**
 * Data Fetching
 */
async function fetchConfig() {
    try {
        const response = await fetch('./config.json');
        if (response.ok) {
            appConfig = await response.json();
            applyConfig();
        }
    } catch (e) { console.warn('Config default used'); }
}

async function fetchLaws() {
    try {
        const response = await fetch('./leyes.json');
        allLaws = response.ok ? await response.json() : [];
        allLaws.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } catch (e) { console.error('Error laws', e); }
}

async function fetchProjects() {
    try {
        const response = await fetch('./proyectos.json');
        allProjects = response.ok ? await response.json() : [];
    } catch (e) { console.error('Error agenda', e); }
}

async function fetchLegislators() {
    try {
        const response = await fetch('./legisladores.json');
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
        
        filtersContainer.appendChild(yearSelect);
        filtersContainer.appendChild(typeSelect);
        
        yearSelect.addEventListener('change', renderCurrentView);
        typeSelect.addEventListener('change', renderCurrentView);
    } else if (view === 'agenda') {
        const stateSelect = document.createElement('select');
        stateSelect.id = 'filter-state';
        stateSelect.innerHTML = '<option value="">Todos los estados</option><option value="en_comision">En Comisión</option><option value="aprobado">Aprobado</option><option value="rechazado">Rechazado</option>';
        filtersContainer.appendChild(stateSelect);
        stateSelect.addEventListener('change', renderCurrentView);
    }
}

/**
 * Rendering Logic
 */
function renderCurrentView() {
    const term = searchInput.value.toLowerCase();
    mainGrid.innerHTML = '';
    hideStatus();

    if (currentView === 'laws') renderLaws(term);
    else if (currentView === 'agenda') renderAgenda(term);
    else if (currentView === 'legislators') renderLegislators(term);
    
    lucide.createIcons();
}

function renderLaws(term) {
    const year = document.getElementById('filter-year')?.value;
    const type = document.getElementById('filter-type')?.value;

    const filtered = allLaws.filter(l => {
        const matchTerm = l.titulo.toLowerCase().includes(term) || (l.expediente && l.expediente.toLowerCase().includes(term));
        const matchYear = !year || String(l.anio) === year;
        const matchType = !type || l.gaceta === type;
        return matchTerm && matchYear && matchType;
    });

    if (filtered.length === 0) return showStatus('No se encontraron leyes.', 'info');

    filtered.forEach(l => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <span class="law-tag">${l.gaceta || 'Ordinaria'}</span>
            <h3 class="law-title">${l.titulo}</h3>
            <div class="law-meta">
                <div class="meta-item"><i data-lucide="file-text" style="width:12px"></i> ${l.expediente}</div>
                <div class="meta-item"><i data-lucide="calendar" style="width:12px"></i> ${l.anio}</div>
            </div>
            <a href="${l.link_drive}" target="_blank" class="btn-primary">
                <i data-lucide="download"></i> Descargar
            </a>
        `;
        mainGrid.appendChild(card);
    });
}

function renderAgenda(term) {
    const state = document.getElementById('filter-state')?.value;

    const filtered = allProjects.filter(p => {
        const matchTerm = p.titulo.toLowerCase().includes(term) || (p.expediente && p.expediente.toLowerCase().includes(term));
        const matchState = !state || p.estado === state;
        return matchTerm && matchState;
    });

    if (filtered.length === 0) return showStatus('No hay proyectos en la agenda.', 'info');

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <span class="status-tag status-${p.estado}">${p.estado.replace('_', ' ')}</span>
            <h3 class="law-title">${p.titulo}</h3>
            <p class="law-meta" style="margin-bottom:1rem">${p.extracto || ''}</p>
            <div class="law-meta">
                <div class="meta-item"><i data-lucide="user" style="width:12px"></i> ${p.ponente}</div>
                <div class="meta-item"><i data-lucide="users" style="width:12px"></i> ${p.comision}</div>
            </div>
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
            <img src="${l.foto || 'https://via.placeholder.com/150'}" class="legislator-img">
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
            <img src="${legislator.foto || 'https://via.placeholder.com/150'}" class="profile-img-lg">
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
        img.onload = () => institutionalLogo.src = './logo.png';
        img.src = './logo.png';
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
