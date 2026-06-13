export let allLaws = [];
export let allProjects = [];
export let allLegislators = [];
export let allJunta = [];
export let appConfig = { chamber_name: 'PARLAMENTUM', timezone: 'UTC' };

function sortByDate(arr, field = 'updated_at') {
  return arr.sort((a, b) => new Date(b[field]) - new Date(a[field]));
}

export async function fetchConfig() {
  try {
    const r = await fetch(`./config.json?t=${Date.now()}`);
    if (r.ok) {
      appConfig = await r.json();
      return appConfig;
    }
  } catch (e) { console.warn('Config default used'); }
  return appConfig;
}

export async function fetchJunta() {
  try {
    const r = await fetch(`./junta_directiva.json?t=${Date.now()}`);
    allJunta = r.ok ? await r.json() : [];
    return allJunta;
  } catch (e) { console.error('Error junta', e); return []; }
}

export async function fetchLaws() {
  try {
    const r = await fetch(`./leyes.json?t=${Date.now()}`);
    allLaws = r.ok ? await r.json() : [];
    sortByDate(allLaws);
    return allLaws;
  } catch (e) { console.error('Error laws', e); return []; }
}

export async function fetchProjects() {
  try {
    const r = await fetch(`./proyectos.json?t=${Date.now()}`);
    allProjects = r.ok ? await r.json() : [];
    return allProjects;
  } catch (e) { console.error('Error agenda', e); return []; }
}

export async function fetchLegislators() {
  try {
    const r = await fetch(`./legisladores.json?t=${Date.now()}`);
    allLegislators = r.ok ? await r.json() : [];
    return allLegislators;
  } catch (e) { console.error('Error legislators', e); return []; }
}
