import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';

export const useLegisData = (defaultConfig) => {
  const [config, setConfig] = useState(defaultConfig);
  const [sessions, setSessions] = useState([]);
  const [legislators, setLegislators] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [oficios, setOficios] = useState([]);
  const [projects, setProjects] = useState([]);
  const [laws, setLaws] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Esperar a que la base de datos esté lista en el proceso principal
      if (window.legisAPI) {
        let ready = false;
        while (!ready) {
          ready = await window.legisAPI.invoke('db:isReady');
          if (!ready) await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const [
        dbConfig,
        dbSessions,
        dbLegislators,
        dbCommissions,
        dbOficios,
        dbProjects,
        dbLaws,
        dbDocuments,
        dbAuditLogs
      ] = await Promise.all([
        dbService.getConfig(),
        dbService.getSessions(),
        dbService.getLegislators(),
        dbService.getCommissions(),
        dbService.getOficios(),
        dbService.getProjects(),
        dbService.getLaws(),
        dbService.getDocuments(),
        dbService.getAuditLogs()
      ]);

      setConfig(prev => ({ ...prev, ...dbConfig }));
      setSessions(dbSessions);
      setLegislators(dbLegislators);
      setCommissions(dbCommissions);
      setOficios(dbOficios);
      setProjects(dbProjects);
      setLaws(dbLaws);
      setDocuments(dbDocuments);
      setAuditLogs(dbAuditLogs);
    } catch (err) {
      console.error('Error loading data from SQLite:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Helper for audit logging
  const logAction = async (action, entityType, entityId, changes = null) => {
    await dbService.addAuditLog({
      action,
      entityType,
      entityId,
      changes,
      userId: config.nombreSecretario || 'admin'
    });
    setAuditLogs(await dbService.getAuditLogs());
  };

  // Actions
  const updateConfig = async (newConfig) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    await dbService.saveConfig(updated);
    await logAction('UPDATE_CONFIG', 'system', 0, newConfig);
  };

  const saveSession = async (session) => {
    const id = await dbService.saveSession(session);
    await loadAllData();
    await logAction(session.id ? 'UPDATE_SESSION' : 'CREATE_SESSION', 'sessions', id || session.id, session);
  };

  const deleteSession = async (id) => {
    await dbService.deleteSession(id);
    await loadAllData();
    await logAction('DELETE_SESSION', 'sessions', id);
  };

  const saveLegislator = async (legislator) => {
    const id = await dbService.saveLegislator(legislator);
    await loadAllData();
    await logAction(legislator.id ? 'UPDATE_LEGISLATOR' : 'CREATE_LEGISLATOR', 'legislators', id || legislator.id, legislator);
  };

  const deleteLegislator = async (id) => {
    await dbService.deleteLegislator(id);
    await loadAllData();
    await logAction('DELETE_LEGISLATOR', 'legislators', id);
  };

  const saveCommission = async (commission) => {
    const id = await dbService.saveCommission(commission);
    await loadAllData();
    await logAction(commission.id ? 'UPDATE_COMMISSION' : 'CREATE_COMMISSION', 'commissions', id || commission.id, commission);
  };

  const deleteCommission = async (id) => {
    await dbService.deleteCommission(id);
    await loadAllData();
    await logAction('DELETE_COMMISSION', 'commissions', id);
  };

  const saveOficio = async (oficio) => {
    const id = await dbService.saveOficio(oficio);
    await loadAllData();
    await logAction(oficio.id ? 'UPDATE_OFICIO' : 'CREATE_OFICIO', 'oficios', id || oficio.id, oficio);
  };

  const deleteOficio = async (id) => {
    await dbService.deleteOficio(id);
    await loadAllData();
    await logAction('DELETE_OFICIO', 'oficios', id);
  };

  const saveProject = async (project) => {
    const id = await dbService.saveProject(project);
    await loadAllData();
    await logAction(project.id ? 'UPDATE_PROJECT' : 'CREATE_PROJECT', 'projects', id || project.id, project);
  };

  const deleteProject = async (id) => {
    await dbService.deleteProject(id);
    await loadAllData();
    await logAction('DELETE_PROJECT', 'projects', id);
  };

  const saveDocument = async (document) => {
    const id = await dbService.saveDocument(document);
    await loadAllData();
    await logAction('CREATE_DOCUMENT', 'documents', id, { nombre: document.nombreOriginal });
  };

  const deleteDocument = async (id) => {
    await dbService.deleteDocument(id);
    await loadAllData();
    await logAction('DELETE_DOCUMENT', 'documents', id);
  };

  const getProjectVersions = async (projectId) => {
    return await dbService.getProjectVersions(projectId);
  };

  return {
    config, setConfig: updateConfig,
    sessions, saveSession, deleteSession,
    legislators, saveLegislator, deleteLegislator,
    commissions, saveCommission, deleteCommission,
    oficios, saveOficio, deleteOficio,
    projects, saveProject, deleteProject,
    laws,
    documents, saveDocument, deleteDocument,
    auditLogs,
    getProjectVersions,
    isLoading, reload: loadAllData
  };
};
