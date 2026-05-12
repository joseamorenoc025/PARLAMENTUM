export const safeJSONParse = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export const getDaysSince = (dateStr) => {
  if (!dateStr) return 999;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const getStagnationColor = (dateStr) => {
  const days = getDaysSince(dateStr);
  if (days > 30) return 'text-red-500 bg-red-500/10 border-red-500/20';
  if (days >= 15) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
};

export const getStagnationLabel = (dateStr) => {
  const days = getDaysSince(dateStr);
  if (days > 30) return 'Estancado (>30 días)';
  if (days >= 15) return 'Atención (15-30 días)';
  return 'Activo (<15 días)';
};

export const getSessionTypeByDate = (dateStr) => {
  if (!dateStr) return 'Ordinaria';
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  if (day === 2 || day === 4) return 'Ordinaria';
  return 'Extraordinaria';
};

export const generateSessionNumber = (tipo, year, existingSessions) => {
  if (tipo === 'Especial' || tipo === 'Solemne' || tipo === 'Instalación') return '';
  const yearSessions = existingSessions.filter(s => 
    s.activo &&
    (s.tipo === 'Ordinaria' || s.tipo === 'Extraordinaria') &&
    s.tipo === tipo &&
    s.numeroCorrelativo &&
    s.numeroCorrelativo.endsWith(`-${year}`)
  );
  const maxNum = yearSessions.reduce((max, s) => {
    const parts = s.numeroCorrelativo.split('-');
    const num = parseInt(parts[0], 10);
    return num > max ? num : max;
  }, 0);
  return `${String(maxNum + 1).padStart(3, '0')}-${year}`;
};

export const getRoutePhases = (origen) => {
  const commonPhases = ['Estudio en Comisión', '1ra Discusión', 'Consulta Pública', '2da Discusión', '3ra Discusión', 'Aprobada', 'Promulgada'];
  if (origen === 'Comisión') {
    return ['Estudio en Comisión', 'Informe de Dirección', ...commonPhases.slice(1)];
  }
  return ['Entrada al Pleno', ...commonPhases];
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
