import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadBackupToGitHub } from '../../electron/src/modules/backup/githubBackup.js';
import fs from 'fs';

// Mock fs
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => Buffer.from('mocked-file-content')),
    statSync: vi.fn(() => ({ size: 100 })),
    createReadStream: vi.fn(() => 'mocked-stream')
  }
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('githubBackup module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe subir un nuevo backup y borrar el anterior exitosamente', async () => {
    // 1. Mock de listar releases (devuelve un release antiguo > 4 horas)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        id: 123,
        name: 'Backup Institucional - 2026-05-01',
        tag_name: 'backup/123',
        published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // Hace 5 horas
      }]
    });

    // 2. Mock de crear nuevo release draft
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 456,
        upload_url: 'https://uploads.github.com/repos/owner/repo/releases/456/assets{?name,label}',
        html_url: 'https://github.com/owner/repo/releases/tag/backup/456'
      })
    });

    // 3. Mock de subir asset
    mockFetch.mockResolvedValueOnce({ ok: true });

    // 4. Mock de publicar release (draft: false)
    mockFetch.mockResolvedValueOnce({ ok: true });

    // 5. Mock de borrar release antiguo
    mockFetch.mockResolvedValueOnce({ ok: true });
    
    // 6. Mock de borrar tag antiguo
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await uploadBackupToGitHub('dummy-token', 'owner', 'repo', 'dummy.clbak');

    expect(result.success).toBe(true);
    expect(result.releaseUrl).toBe('https://github.com/owner/repo/releases/tag/backup/456');
    expect(mockFetch).toHaveBeenCalledTimes(6);
  });

  it('debe fallar si el último backup fue hace menos de 4 horas', async () => {
    // 1. Mock de listar releases (devuelve un release hace 2 horas)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        id: 123,
        name: 'Backup Institucional - Hoy',
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // Hace 2 horas
      }]
    });

    await expect(uploadBackupToGitHub('dummy-token', 'owner', 'repo', 'dummy.clbak'))
      .rejects
      .toThrow(/Rate limit:/);

    expect(mockFetch).toHaveBeenCalledTimes(1); // Solo se listan los releases
  });
});
