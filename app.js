let allLaws = [];

// Elementos del DOM
const lawsGrid = document.getElementById('laws-grid');
const searchInput = document.getElementById('search-input');
const filterYear = document.getElementById('filter-year');
const filterType = document.getElementById('filter-type');
const lastUpdateSpan = document.getElementById('last-update');
const statusMessage = document.getElementById('status-message');

/**
 * Inicialización
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar iconos de Lucide
    lucide.createIcons();
    
    // Cargar datos
    await fetchLaws();
    
    // Eventos
    searchInput.addEventListener('input', renderLaws);
    filterYear.addEventListener('change', renderLaws);
    filterType.addEventListener('change', renderLaws);
});

/**
 * Obtiene las leyes desde el archivo JSON
 */
async function fetchLaws() {
    try {
        // Intentamos cargar leyes.json desde la raíz
        const response = await fetch('./leyes.json');
        if (!response.ok) throw new Error('No se pudo cargar la base de datos de leyes.');
        
        allLaws = await response.json();
        
        // Ordenar por fecha (más reciente primero)
        allLaws.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        
        populateYearFilter();
        updateLastUpdate();
        renderLaws();
    } catch (error) {
        console.error('Error fetching laws:', error);
        showStatus('⚠️ Error: No se pudo conectar con la biblioteca de leyes. Intente más tarde.', 'error');
        lawsGrid.innerHTML = '';
    }
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
 * Renderiza las leyes aplicando filtros
 */
function renderLaws() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedYear = filterYear.value;
    const selectedType = filterType.value;
    
    const filtered = allLaws.filter(law => {
        const matchesSearch = 
            law.titulo.toLowerCase().includes(searchTerm) || 
            (law.expediente && law.expediente.toLowerCase().includes(searchTerm));
        
        const matchesYear = !selectedYear || String(law.anio) === selectedYear;
        const matchesType = !selectedType || law.type === selectedType;
        
        return matchesSearch && matchesYear && matchesType;
    });
    
    lawsGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        showStatus('No se encontraron leyes que coincidan con tu búsqueda.', 'info');
        return;
    }
    
    hideStatus();
    
    filtered.forEach(law => {
        const card = document.createElement('div');
        card.className = 'law-card';
        
        const date = law.fecha_publicacion ? new Date(law.fecha_publicacion).toLocaleDateString() : 'N/A';
        
        card.innerHTML = `
            <span class="law-tag">${law.tipo || 'General'}</span>
            <h3 class="law-title">${law.titulo}</h3>
            <div class="law-meta">
                <div class="meta-item"><i data-lucide="file-text" style="width:12px"></i> Exp: ${law.expediente || 'S/E'}</div>
                <div class="meta-item"><i data-lucide="calendar" style="width:12px"></i> ${date}</div>
            </div>
            <a href="${law.link_drive || '#'}" target="_blank" class="download-btn ${!law.link_drive ? 'disabled' : ''}">
                <i data-lucide="download"></i>
                Descargar PDF
            </a>
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
