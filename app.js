let allLaws = [];
let filteredLaws = [];
let appConfig = {};
let searchIndex = new Map();
let currentPage = 1;
const ITEMS_PER_PAGE = 12;

// Elementos del DOM
const lawsGrid = document.getElementById('laws-grid');
const searchInput = document.getElementById('search-input');
const filterYear = document.getElementById('filter-year');
const filterType = document.getElementById('filter-type');
const lastUpdateSpan = document.getElementById('last-update');
const statusMessage = document.getElementById('status-message');
const chamberNameElem = document.getElementById('chamber-name');
const footerChamberNameElem = document.getElementById('footer-chamber-name');

/**
 * Crea un índice invertido para búsquedas ultra rápidas
 */
function createSearchIndex() {
    searchIndex.clear();
    allLaws.forEach((law, index) => {
        const textToIndex = `${law.titulo} ${law.expediente || ''} ${law.tipo || ''} ${law.numero || ''}`.toLowerCase();
        const words = textToIndex.split(/\s+/).filter(w => w.length > 2);
        
        words.forEach(word => {
            if (!searchIndex.has(word)) searchIndex.set(word, new Set());
            searchIndex.get(word).add(index);
        });
    });
}

/**
 * Inicialización
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar iconos de Lucide
    lucide.createIcons();
    
    // Cargar configuración y datos
    await fetchConfig();
    await fetchLaws();
    
    // Eventos
    searchInput.addEventListener('input', () => { currentPage = 1; renderLaws(); });
    filterYear.addEventListener('change', () => { currentPage = 1; renderLaws(); });
    filterType.addEventListener('change', () => { currentPage = 1; renderLaws(); });

    // Scroll Infinito
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            if (currentPage * ITEMS_PER_PAGE < filteredLaws.length) {
                currentPage++;
                renderLaws(true); // true = append mode
            }
        }
    });
});

/**
 * Obtiene la configuración del portal
 */
async function fetchConfig() {
    try {
        const response = await fetch('./config.json');
        if (response.ok) {
            appConfig = await response.json();
            if (appConfig.chamber_name) {
                if (chamberNameElem) chamberNameElem.textContent = appConfig.chamber_name;
                if (footerChamberNameElem) footerChamberNameElem.textContent = appConfig.chamber_name;
                document.title = `${appConfig.chamber_name} | Portal Ciudadano`;
            }
        }
    } catch (error) {
        console.error('Error fetching config:', error);
    }
}

/**
 * Obtiene las leyes desde el archivo JSON
 */
async function fetchLaws() {
    try {
        const response = await fetch('../../leyes.json');
        if (!response.ok) {
            const localResponse = await fetch('./leyes.json');
            if (!localResponse.ok) throw new Error('No se pudo cargar la base de datos de leyes.');
            allLaws = await localResponse.json();
        } else {
            allLaws = await response.json();
        }
        
        allLaws.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        
        createSearchIndex(); // Generar índice
        populateYearFilter();
        populateTypeFilter();
        updateLastUpdate();
        renderLaws();
    } catch (error) {
        console.error('Error fetching laws:', error);
        showStatus('⚠️ Error: No se pudo conectar con la biblioteca de leyes. Intente más tarde.', 'error');
        lawsGrid.innerHTML = '';
    }
}

/**
 * Llena el selector de tipos dinámicamente
 */
function populateTypeFilter() {
    const types = [...new Set(allLaws.map(law => law.tipo || 'General').filter(Boolean))];
    types.sort();
    
    // Limpiar opciones previas excepto la primera
    while (filterType.options.length > 1) {
        filterType.remove(1);
    }
    
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        filterType.appendChild(option);
    });
}

/**
 * Llena el selector de años dinámicamente
 */
function populateYearFilter() {
    const years = [...new Set(allLaws.map(law => law.anio).filter(Boolean))];
    years.sort((a, b) => b - a);
    
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        filterYear.appendChild(option);
    });
}

/**
 * Muestra la fecha de última actualización
 */
function updateLastUpdate() {
    if (allLaws.length > 0) {
        const latest = allLaws[0].updated_at;
        const date = new Date(latest);
        lastUpdateSpan.textContent = `Actualizado: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    } else {
        lastUpdateSpan.textContent = 'Sin leyes registradas';
    }
}

/**
 * Transforma un link de Google Drive a un link de descarga directa
 */
function transformDriveLink(urlStr) {
    if (!urlStr) return '#';
    
    try {
        const parsedUrl = new URL(urlStr);
        if (parsedUrl.hostname === 'drive.google.com' || parsedUrl.hostname.endsWith('.drive.google.com')) {
            const match = parsedUrl.pathname.match(/\/d\/(.+?)(\/|$|\?)/);
            if (match && match[1]) {
                const fileId = match[1];
                return `https://drive.google.com/uc?export=download&id=${fileId}`;
            }
        }
    } catch (e) {
        console.error('Error transformando link de Drive:', e);
    }
    
    return urlStr;
}

/**
 * Renderiza las leyes aplicando filtros
 */
function renderLaws(append = false) {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedYear = filterYear.value;
    const selectedType = filterType.value;
    
    // Si no es append, filtramos todo de nuevo
    if (!append) {
        filteredLaws = allLaws.filter(law => {
            const matchesSearch = 
                law.titulo.toLowerCase().includes(searchTerm) || 
                (law.expediente && law.expediente.toLowerCase().includes(searchTerm));
            
            const matchesYear = !selectedYear || String(law.anio) === selectedYear;
            const matchesType = !selectedType || law.tipo === selectedType;
            
            return matchesSearch && matchesYear && matchesType;
        });
        lawsGrid.innerHTML = '';
    }
    
    if (filteredLaws.length === 0) {
        showStatus('No se encontraron leyes que coincidan con tu búsqueda.', 'info');
        return;
    }
    
    hideStatus();
    
    // Paginar
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filteredLaws.slice(start, end);
    
    pageItems.forEach(law => {
        const card = document.createElement('div');
        card.className = 'law-card';
        
        // Detectar si es nueva (menos de 7 días)
        const isNew = law.fecha_publicacion && (new Date() - new Date(law.fecha_publicacion)) < (7 * 24 * 60 * 60 * 1000);
        
        const date = law.fecha_publicacion ? new Date(law.fecha_publicacion).toLocaleDateString() : 'N/A';
        const downloadUrl = transformDriveLink(law.link_drive);
        
        const shareText = encodeURIComponent(`📌 *${appConfig.chamber_name || 'PARLAMENTUM'}*\n📜 *Ley:* ${law.titulo}\n🔗 *Descargar:* ${downloadUrl}`);
        const whatsappUrl = `https://wa.me/?text=${shareText}`;
        
        card.innerHTML = `
            <div class="law-card-header">
                <div class="tags-row">
                    <span class="law-tag">${law.tipo || 'General'}</span>
                    ${isNew ? '<span class="new-badge">NUEVO</span>' : ''}
                </div>
                <a href="${whatsappUrl}" target="_blank" class="share-btn" title="Compartir por WhatsApp">
                    <i data-lucide="share-2"></i>
                </a>
            </div>
            <h3 class="law-title">${law.titulo}</h3>
            <div class="law-meta">
                <div class="meta-item"><i data-lucide="file-text" style="width:12px"></i> ${law.numero ? '#' + law.numero : 'Exp: ' + (law.expediente || 'S/E')}</div>
                <div class="meta-item"><i data-lucide="calendar" style="width:12px"></i> ${date}</div>
            </div>
            <div class="law-actions">
                <a href="${downloadUrl}" target="_blank" class="download-btn ${!law.link_drive ? 'disabled' : ''}">
                    <i data-lucide="download"></i>
                    Descargar PDF
                </a>
            </div>
        `;
        
        lawsGrid.appendChild(card);
    });
    
    lucide.createIcons();
}

/**
 * Helpers de UI
 */
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove('hidden');
    lawsGrid.innerHTML = '';
}

function hideStatus() {
    statusMessage.classList.add('hidden');
}
