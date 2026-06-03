import { allLaws, allProjects } from '../data.js';

export function renderStatsDashboard() {
  const dashboard = document.getElementById('stats-dashboard');
  dashboard.innerHTML = '';

  const totalLaws = allLaws.length;
  const activeProjects = allProjects.filter(p => p.estado !== 'aprobado' && p.estado !== 'rechazado').length;
  const approvedProjects = allProjects.filter(p => p.estado === 'aprobado').length;
  const totalProjects = allProjects.length;
  const efficiencyRate = totalProjects > 0 ? Math.round((approvedProjects / totalProjects) * 100) : 0;

  const lawsByYear = {};
  allLaws.forEach(l => { if (l.anio) lawsByYear[l.anio] = (lawsByYear[l.anio] || 0) + 1; });

  const projectsByPhase = {};
  allProjects.forEach(p => { const phase = p.fase_actual || 'Estudio en Comisión'; projectsByPhase[phase] = (projectsByPhase[phase] || 0) + 1; });

  const maxLawsCount = Math.max(...Object.values(lawsByYear), 1);
  const maxProjectsCount = Math.max(...Object.values(projectsByPhase), 1);

  const lawsBarsHtml = Object.keys(lawsByYear).sort((a, b) => b - a).map((year, index) => {
    const count = lawsByYear[year];
    const hue = 240 + (index * 15) % 80;
    return barItem(`Año ${year}`, count, count === 1 ? 'Ley' : 'Leyes', count, maxLawsCount, hue, 70, 60);
  }).join('');

  const projectsBarsHtml = Object.keys(projectsByPhase).sort((a, b) => projectsByPhase[b] - projectsByPhase[a]).map((phase, index) => {
    const count = projectsByPhase[phase];
    const hue = 140 + (index * 25) % 100;
    return barItem(phase, count, count === 1 ? 'Proyecto' : 'Proyectos', count, maxProjectsCount, hue, 70, 50);
  }).join('');

  dashboard.innerHTML = `
    <div class="stats-header">
      <h2>Estadísticas Legislativas</h2>
      <p>Monitoreo en tiempo real de la productividad legislativa, leyes aprobadas y trámites en curso.</p>
    </div>
    <div class="stats-grid">
      ${statCard('scale', 'Leyes Aprobadas', totalLaws, '#e0e7ff', '#4f46e5')}
      ${statCard('calendar', 'En Debate Activo', activeProjects, '#fffbeb', '#d97706')}
      ${statCard('trending-up', 'Eficiencia de Aprobación', `${efficiencyRate}%`, '#eff6ff', '#2563eb')}
    </div>
    <div class="stats-charts-row">
      <div class="chart-card">
        <h3><i data-lucide="bar-chart" style="color: #4f46e5; width: 18px; height: 18px;"></i> Histórico de Leyes Aprobadas</h3>
        <div class="chart-bars">${totalLaws > 0 ? lawsBarsHtml : '<p class="chart-empty">No hay registro histórico de leyes.</p>'}</div>
      </div>
      <div class="chart-card">
        <h3><i data-lucide="pie-chart" style="color: #10b981; width: 18px; height: 18px;"></i> Proyectos por Fase del Proceso</h3>
        <div class="chart-bars">${totalProjects > 0 ? projectsBarsHtml : '<p class="chart-empty">No hay proyectos registrados en la agenda.</p>'}</div>
      </div>
    </div>
  `;

  setTimeout(() => {
    dashboard.querySelectorAll('.chart-bar-fill').forEach(fill => {
      fill.style.width = fill.getAttribute('data-width');
    });
  }, 100);
}

function barItem(label, count, singular, value, max, hue, sat, light) {
  const pct = Math.round((value / max) * 100);
  return `
    <div class="chart-bar-item">
      <div class="chart-bar-label"><span>${label}</span><span>${count} ${singular}</span></div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" data-width="${pct}%" style="background: hsl(${hue}, ${sat}%, ${light}%);"></div>
      </div>
    </div>`;
}

function statCard(icon, label, value, bg, color) {
  return `
    <div class="stat-counter-card">
      <div class="stat-counter-icon" style="background: ${bg}; color: ${color};">
        <i data-lucide="${icon}" style="width: 24px; height: 24px;"></i>
      </div>
      <div class="stat-counter-info">
        <h3>${label}</h3>
        <div class="stat-value">${value}</div>
      </div>
    </div>`;
}
