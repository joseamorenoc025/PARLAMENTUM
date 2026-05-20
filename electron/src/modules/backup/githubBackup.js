import fs from 'fs';
import path from 'path';
import { logger } from '../../lib/logger.js';

const GITHUB_API_BASE = 'https://api.github.com';

export const uploadBackupToGitHub = async (token, owner, repo, filePath) => {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Parlamentum-App'
  };

  try {
    // 1. Get existing releases
    const releasesRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/releases`, { headers });
    if (!releasesRes.ok) {
      if (releasesRes.status === 401 || releasesRes.status === 403 || releasesRes.status === 404) {
        throw new Error('Permisos insuficientes o repositorio no encontrado.');
      }
      throw new Error(`Error al listar releases: ${releasesRes.statusText}`);
    }
    
    const releases = await releasesRes.json();
    const backupReleases = releases.filter(r => r.name && r.name.startsWith('Backup Institucional'));

    // 2. Rate limiting check (4 hours)
    if (backupReleases.length > 0) {
      const latestBackup = backupReleases[0];
      const lastBackupDate = new Date(latestBackup.published_at || latestBackup.created_at);
      const now = new Date();
      const hoursSinceLastBackup = (now - lastBackupDate) / (1000 * 60 * 60);
      
      if (hoursSinceLastBackup < 4) {
        throw new Error(`Rate limit: El último backup fue hace ${hoursSinceLastBackup.toFixed(1)} horas. Espere al menos 4 horas.`);
      }
    }

    // 3. Create NEW Release as Draft
    const dateStr = new Date().toISOString().slice(0, 10);
    const releaseName = `Backup Institucional - ${dateStr}`;
    const tagName = `backup/${Date.now()}`;

    const createRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/releases`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: tagName,
        name: releaseName,
        body: 'Respaldo automático cifrado generado por PARLAMENTUM.',
        draft: true,
        prerelease: false
      })
    });

    if (!createRes.ok) throw new Error(`Error creando release: ${createRes.statusText}`);
    const newRelease = await createRes.json();

    // 4. Upload Asset
    const fileStats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const uploadUrl = newRelease.upload_url.replace(/\{.*\}/, '') + `?name=${encodeURIComponent(fileName)}`;

    const fileBuffer = fs.readFileSync(filePath);
    
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileStats.size.toString()
      },
      body: fileBuffer
    });

    if (!uploadRes.ok) {
      // If upload fails, try to delete the draft release so it doesn't leave garbage
      await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/releases/${newRelease.id}`, {
        method: 'DELETE',
        headers
      });
      throw new Error(`Error subiendo archivo: ${uploadRes.statusText}`);
    }

    // 5. Publish the release (draft = false)
    const publishRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/releases/${newRelease.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft: false })
    });

    if (!publishRes.ok) {
        throw new Error(`Error publicando release: ${publishRes.statusText}`);
    }

    // 6. Delete old backup releases
    for (const oldRelease of backupReleases) {
      await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/releases/${oldRelease.id}`, {
        method: 'DELETE',
        headers
      });
      
      // Borrar el tag también, ya que borrar release no borra el tag
      await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/tags/${oldRelease.tag_name}`, {
        method: 'DELETE',
        headers
      });
    }

    logger.info('Backup subido a GitHub exitosamente');
    return { success: true, releaseUrl: newRelease.html_url };

  } catch (err) {
    logger.error('Error uploading backup to GitHub Releases:', err);
    throw err;
  }
};

export const downloadBackupFromGitHub = async (token, owner, repo, targetPath) => {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Parlamentum-App'
  };

  try {
    const releasesRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/releases`, { headers });
    if (!releasesRes.ok) throw new Error('Error al listar releases');

    const releases = await releasesRes.json();
    const backupReleases = releases.filter(r => r.name && r.name.startsWith('Backup Institucional'));

    if (backupReleases.length === 0) {
      throw new Error('No se encontró ningún respaldo en la nube.');
    }

    // Sort by created_at descending just in case
    backupReleases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latestRelease = backupReleases[0];

    if (!latestRelease.assets || latestRelease.assets.length === 0) {
      throw new Error('El release de respaldo no contiene archivos (assets).');
    }

    const assetId = latestRelease.assets[0].id;

    // Download asset
    const assetRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/releases/assets/${assetId}`, {
      headers: { ...headers, 'Accept': 'application/octet-stream' }
    });

    if (!assetRes.ok) throw new Error('Error descargando archivo de respaldo');

    const arrayBuffer = await assetRes.arrayBuffer();
    fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));

    return { success: true, date: latestRelease.created_at };
  } catch (err) {
    logger.error('Error downloading backup from GitHub:', err);
    throw err;
  }
};
