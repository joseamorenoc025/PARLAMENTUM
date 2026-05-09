import fs from 'fs';
import { logger } from '../../lib/logger.js';
import { GitHubClient } from '../sync/githubClient.js';

export const uploadBackupToGitHub = async (token, owner, repo, filePath) => {
  try {
    const client = new GitHubClient(token);
    const content = fs.readFileSync(filePath); // Buffer
    const fileName = `backups/backup_sync.clbak`;

    // Obtener SHA si existe
    const remote = await client.getRemoteFile(owner, repo, fileName);
    
    await client.updateFile(
      owner,
      repo,
      fileName,
      content,
      'Cloud Sync: Respaldo de seguridad actualizado',
      remote.sha
    );

    return { success: true };
  } catch (err) {
    logger.error('Error uploading backup to GitHub:', err);
    throw err;
  }
};

export const downloadBackupFromGitHub = async (token, owner, repo, targetPath) => {
  try {
    const client = new GitHubClient(token);
    const fileName = `backups/backup_sync.clbak`;

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`, {
      headers: client.headers
    });

    if (!response.ok) throw new Error('No se encontró el respaldo en la nube');
    
    const data = await response.json();
    const content = Buffer.from(data.content, 'base64');
    fs.writeFileSync(targetPath, content);

    return { success: true };
  } catch (err) {
    logger.error('Error downloading backup from GitHub:', err);
    throw err;
  }
};
