import { appConfig } from './data.js';

export function showStatus(msg, type) {
  const el = document.getElementById('status-message');
  el.textContent = msg;
  el.className = `status-message ${type}`;
  el.classList.remove('hidden');
}

export function hideStatus() {
  const el = document.getElementById('status-message');
  if (el) el.classList.add('hidden');
}

export function applyConfig() {
  const nameDisplay = document.getElementById('chamber-name-display');
  const footerName = document.getElementById('footer-chamber-name');
  if (nameDisplay) nameDisplay.textContent = appConfig.chamber_name;
  if (footerName) footerName.textContent = appConfig.chamber_name;

  const logo = document.getElementById('institutional-logo');
  if (!logo) return;
  const img = new Image();
  img.onload = () => { logo.src = './logo.png'; logo.style.display = 'block'; };
  img.onerror = () => {
    const fallback = new Image();
    fallback.onload = () => { logo.src = './assets/logo-institucional.png'; logo.style.display = 'block'; };
    fallback.onerror = () => { logo.style.display = 'none'; };
    fallback.src = './assets/logo-institucional.png';
  };
  img.src = './logo.png';
}

export function getDefaultAvatar() {
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiLz48cGF0aCBkPSJNMTIgMTJjLTIuNjcgMCA4IDEuMzQtOCA0djJoMTZ2LTJjMC0yLjY2LTUuMzMtNC04LTR6bTAtMmEzIDMgMCAxIDAgMC02IDMgMyAwIDAgMCAwIDZ6IiBmaWxsPSIjNjQ3NDhiIi8+PC9zdmc+';
}
