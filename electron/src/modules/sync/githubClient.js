import { logger } from '../../lib/logger.js';

const GITHUB_API_URL = 'https://api.github.com';

/**
 * Cliente para interactuar con la API de GitHub.
 */
export class GitHubClient {
  constructor(token) {
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Cerebro-Legislativo-App'
    };
  }

  /**
   * Valida el token actual obteniendo la información del usuario.
   */
  async validateToken() {
    try {
      const response = await fetch(`${GITHUB_API_URL}/user`, { headers: this.headers });
      if (!response.ok) {
        throw new Error(`Error de validación: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      logger.info(`Token validado para el usuario: ${data.login}`);
      return data;
    } catch (error) {
      logger.error('Error al validar el token de GitHub:', error);
      throw error;
    }
  }

  /**
   * Obtiene un archivo remoto y su SHA.
   * @param {string} owner 
   * @param {string} repo 
   * @param {string} path 
   */
  async getRemoteFile(owner, repo, path) {
    try {
      const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
        headers: this.headers
      });

      if (response.status === 404) {
        return { content: null, sha: null, exists: false };
      }

      if (!response.ok) {
        throw new Error(`Error al obtener archivo: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // El contenido viene en base64
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      
      return {
        content,
        sha: data.sha,
        exists: true
      };
    } catch (error) {
      logger.error(`Error en getRemoteFile (${path}):`, error);
      throw error;
    }
  }

  /**
   * Crea o actualiza un archivo en el repositorio.
   * @param {string} owner 
   * @param {string} repo 
   * @param {string} path 
   * @param {string} content 
   * @param {string} message 
   * @param {string} sha (opcional para actualizaciones)
   */
  async updateFile(owner, repo, path, content, message, sha = null) {
    try {
      const body = {
        message,
        content: Buffer.from(content).toString('base64'),
      };

      if (sha) {
        body.sha = sha;
      }

      const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al actualizar archivo: ${response.status} ${errorData.message}`);
      }

      const data = await response.json();
      logger.info(`Archivo ${path} actualizado en GitHub. Nuevo SHA: ${data.content.sha}`);
      return data;
    } catch (error) {
      logger.error(`Error en updateFile (${path}):`, error);
      throw error;
    }
  }
}
