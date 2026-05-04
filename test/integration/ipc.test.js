import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupIPCHandlers } from '../../electron/src/ipc/handlers.js';
import { ipcMain } from 'electron';

// Mock de Electron
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  app: {
    getVersion: vi.fn(() => '1.0.0'),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  }
}));

// Mock de DB y Logger
vi.mock('../../electron/src/db/index.js', () => ({
  sqlite: {
    prepare: vi.fn(() => ({
      get: vi.fn(() => ({ ok: 1 }))
    })),
  },
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  }
}));

vi.mock('../../electron/src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  }
}));

describe('IPC Integration Handlers', () => {
  const mockWindow = {};

  beforeEach(() => {
    vi.clearAllMocks();
    setupIPCHandlers(mockWindow);
  });

  it('debe registrar el handler app:health', () => {
    expect(ipcMain.handle).toHaveBeenCalledWith('app:health', expect.any(Function));
  });

  it('debe registrar el handler app:analytics:status', () => {
    expect(ipcMain.handle).toHaveBeenCalledWith('app:analytics:status', expect.any(Function));
  });

  it('debe registrar el handler db:get-stats', () => {
    expect(ipcMain.handle).toHaveBeenCalledWith('db:get-stats', expect.any(Function));
  });

  it('el handler app:health debe retornar el estado correcto', async () => {
    // Obtener la función del handler registrado
    const healthHandler = ipcMain.handle.mock.calls.find(call => call[0] === 'app:health')[1];
    const result = await healthHandler();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('connected');
    expect(result.version).toBe('1.0.0');
  });
});
