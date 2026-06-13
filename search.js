import { allLaws, allProjects, allJunta, allLegislators } from './data.js';

let fuseJunta = null;
let fuseLaws = null;
let fuseAgenda = null;
let fuseLegislators = null;

function createFuse(data, keys, opts = {}) {
  if (!window.Fuse) return null;
  return new Fuse(data, { threshold: 0.4, distance: 100, includeScore: true, ignoreLocation: true, minMatchCharLength: 2, keys, ...opts });
}

export function initSearch() {
  fuseJunta = createFuse(allJunta, [
    { name: 'nombre', weight: 0.5 },
    { name: 'rol', weight: 0.3 },
    { name: 'partido', weight: 0.2 },
    { name: 'biografia', weight: 0.1 }
  ]);

  fuseLaws = createFuse(allLaws, [
    { name: 'titulo', weight: 0.4 },
    { name: 'expediente', weight: 0.3 },
    { name: 'tags', weight: 0.2 },
    { name: 'tipo', weight: 0.1 }
  ]);

  fuseAgenda = createFuse(allProjects, [
    { name: 'titulo', weight: 0.4 },
    { name: 'expediente', weight: 0.2 },
    { name: 'tags', weight: 0.2 },
    { name: 'extracto', weight: 0.1 },
    { name: 'ponente', weight: 0.1 }
  ]);

  fuseLegislators = createFuse(allLegislators, [
    { name: 'nombre', weight: 0.5 },
    { name: 'partido', weight: 0.3 },
    { name: 'biografia', weight: 0.2 }
  ]);
}

export function search(view, term) {
  const fuseMap = { junta: fuseJunta, laws: fuseLaws, agenda: fuseAgenda, legislators: fuseLegislators };
  const fuse = fuseMap[view];
  if (!fuse || term.length < 2) return null;
  return fuse.search(term);
}
