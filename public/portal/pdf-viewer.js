import { trackPreview, trackDownload } from './tracking.js';

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let pdfScale = 1.0;

export function openPdfPreview(url, title, type, id) {
  trackPreview(title, type, id);
  currentPage = 1;
  pdfScale = 1.0;
  closePdfPreview();

  const modal = document.createElement('div');
  modal.id = 'pdf-preview-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-label', 'Vista previa del documento');
  modal.innerHTML = `
    <div class="pdf-modal-content">
      <div class="pdf-modal-header">
        <h3 title="${title.replace(/"/g, '&quot;')}">${title}</h3>
        <button class="pdf-close-btn" id="pdf-close-btn">✕ Cerrar</button>
      </div>
      <div class="pdf-canvas-container">
        <div class="pdf-loading-spinner" id="pdf-spinner">
          <div class="spinner"></div>
          <span>Cargando documento...</span>
        </div>
        <canvas id="pdf-canvas"></canvas>
      </div>
      <div class="pdf-controls">
        <div class="pdf-controls-group">
          <button id="pdf-prev" class="pdf-btn">◀ Anterior</button>
          <span class="pdf-page-indicator">Pág. <span id="pdf-page-num">1</span> de <span id="pdf-page-count">-</span></span>
          <button id="pdf-next" class="pdf-btn">Siguiente ▶</button>
        </div>
        <div class="pdf-controls-group">
          <button class="pdf-btn" id="pdf-zoom-out"><i data-lucide="zoom-out" style="width:14px;height:14px;"></i></button>
          <span id="pdf-zoom-percent" style="font-size:0.75rem; font-weight:600; min-width:40px; text-align:center;">100%</span>
          <button class="pdf-btn" id="pdf-zoom-in"><i data-lucide="zoom-in" style="width:14px;height:14px;"></i></button>
          <button class="pdf-btn" id="pdf-zoom-fit"><i data-lucide="maximize" style="width:14px;height:14px;"></i> Ajustar</button>
        </div>
      </div>
      <div class="pdf-download-footer">
        <a href="${url}" target="_blank" class="download-btn" id="pdf-download-link">
          <i data-lucide="download"></i> Descargar PDF Completo
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', handlePdfKeydown);

  // Wire events
  document.getElementById('pdf-close-btn').addEventListener('click', closePdfPreview);
  document.getElementById('pdf-prev').addEventListener('click', () => changePage(-1));
  document.getElementById('pdf-next').addEventListener('click', () => changePage(1));
  document.getElementById('pdf-zoom-out').addEventListener('click', () => changeZoom(-0.25));
  document.getElementById('pdf-zoom-in').addEventListener('click', () => changeZoom(0.25));
  document.getElementById('pdf-zoom-fit').addEventListener('click', () => changeZoom('fit'));
  document.getElementById('pdf-download-link').addEventListener('click', () => trackDownload(title, type, id));

  // Close on backdrop click
  modal.addEventListener('click', (e) => { if (e.target === modal) closePdfPreview(); });

  if (window.lucide) window.lucide.createIcons();

  loadPdf(url);
}

function handlePdfKeydown(e) {
  if (e.key === 'Escape') closePdfPreview();
  if (e.key === 'ArrowLeft') changePage(-1);
  if (e.key === 'ArrowRight') changePage(1);
}

async function loadPdf(url) {
  if (!window.pdfjsLib) return;
  try {
    const loadingTask = window.pdfjsLib.getDocument(encodeURI(url));
    pdfDoc = await loadingTask.promise;
    totalPages = pdfDoc.numPages;
    document.getElementById('pdf-page-count').textContent = totalPages;
    renderPage(1);
  } catch (err) {
    console.error('Error loading PDF:', err);
    const spinner = document.getElementById('pdf-spinner');
    if (spinner) spinner.innerHTML = '<span style="color:#f87171; text-align:center; padding: 1rem;">⚠️ Vista previa no disponible para este enlace externo. Puede intentar descargarlo directamente.</span>';
  }
}

function renderPage(num) {
  if (!pdfDoc) return;
  currentPage = num;
  document.getElementById('pdf-page-num').textContent = num;
  document.getElementById('pdf-prev').disabled = num <= 1;
  document.getElementById('pdf-next').disabled = num >= totalPages;

  const spinner = document.getElementById('pdf-spinner');
  if (spinner) spinner.style.display = 'flex';

  pdfDoc.getPage(num).then(page => {
    const canvas = document.getElementById('pdf-canvas');
    if (!canvas) return;
    const context = canvas.getContext('2d');

    let viewport = page.getViewport({ scale: pdfScale });
    if (pdfScale === 'fit') {
      const container = canvas.parentElement;
      const fitScale = (container.clientWidth - 48) / page.getViewport({ scale: 1.0 }).width;
      pdfScale = Math.min(Math.max(fitScale, 0.5), 2.0);
      viewport = page.getViewport({ scale: pdfScale });
      document.getElementById('pdf-zoom-percent').textContent = `${Math.round(pdfScale * 100)}%`;
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    page.render({ canvasContext: context, viewport }).promise.then(() => {
      if (spinner) spinner.style.display = 'none';
    });
  });
}

function changePage(delta) {
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) renderPage(newPage);
}

function changeZoom(delta) {
  if (delta === 'fit') {
    pdfScale = 'fit';
    document.getElementById('pdf-zoom-percent').textContent = 'Ajustar';
  } else {
    if (pdfScale === 'fit') pdfScale = 1.0;
    const newScale = pdfScale + delta;
    if (newScale >= 0.5 && newScale <= 3.0) {
      pdfScale = newScale;
      document.getElementById('pdf-zoom-percent').textContent = `${Math.round(pdfScale * 100)}%`;
    }
  }
  renderPage(currentPage);
}

export function closePdfPreview() {
  const modal = document.getElementById('pdf-preview-modal');
  if (modal) modal.remove();
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handlePdfKeydown);
  pdfDoc = null;
}
