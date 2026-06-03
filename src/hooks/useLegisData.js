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
  const [agreements, setAgreements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const waitForDB = useCallback(async () => {
    if (!window.legisAPI) return;
    let ready = false;
    while (!ready) {
      ready = await window.legisAPI.db.isReady();
      if (!ready) await new Promise(resolve => setTimeout(resolve, 500));
    }
  }, []);

  const loadConfig = useCallback(async () => {
    const dbConfig = await dbService.getConfig();
    setConfig(prev => ({ ...prev, ...dbConfig }));
  }, []);

  const loadSessions = useCallback(async () => setSessions(await dbService.getSessions()), []);
  const loadLegislators = useCallback(async () => setLegislators(await dbService.getLegislators()), []);
  const loadCommissions = useCallback(async () => setCommissions(await dbService.getCommissions()), []);
  const loadOficios = useCallback(async () => setOficios(await dbService.getOficios()), []);
  const loadProjects = useCallback(async () => setProjects(await dbService.getProjects()), []);
  const loadLaws = useCallback(async () => setLaws(await dbService.getLaws()), []);
  const loadAgreements = useCallback(async () => setAgreements(await dbService.getAgreements()), []);
  const loadDocuments = useCallback(async () => setDocuments(await dbService.getDocuments()), []);
  const loadAuditLogs = useCallback(async () => setAuditLogs(await dbService.getAuditLogs()), []);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await waitForDB();
      const [
        dbConfig, dbSessions, dbLegislators, dbCommissions,
        dbOficios, dbProjects, dbLaws, dbAgreements, dbDocuments, dbAuditLogs
      ] = await Promise.all([
        dbService.getConfig(), dbService.getSessions(), dbService.getLegislators(),
        dbService.getCommissions(), dbService.getOficios(), dbService.getProjects(),
        dbService.getLaws(), dbService.getAgreements(), dbService.getDocuments(),
        dbService.getAuditLogs()
      ]);
      setConfig(prev => ({ ...prev, ...dbConfig }));
      setSessions(dbSessions);
      setLegislators(dbLegislators);
      setCommissions(dbCommissions);
      setOficios(dbOficios);
      setProjects(dbProjects);
      setLaws(dbLaws);
      setAgreements(dbAgreements);
      setDocuments(dbDocuments);
      setAuditLogs(dbAuditLogs);
    } catch (err) {
      console.error('Error loading data from SQLite:', err);
    } finally {
      setIsLoading(false);
    }
  }, [waitForDB]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  const logAction = async (action, entityType, entityId, changes = null) => {
    await dbService.addAuditLog({
      action, entityType, entityId, changes,
      userId: config.nombreSecretario || 'admin'
    });
    await loadAuditLogs();
  };

  const updateConfig = async (newConfig) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    await dbService.saveConfig(updated);
    await logAction('UPDATE_CONFIG', 'system', 0, newConfig);
  };

  const saveSession = async (session) => {
    const id = await dbService.saveSession(session);
    await loadSessions();
    await logAction(session.id ? 'UPDATE_SESSION' : 'CREATE_SESSION', 'sessions', id || session.id, session);
    return id || session.id;
  };
  const deleteSession = async (id) => {
    await dbService.deleteSession(id);
    await loadSessions();
    await logAction('DELETE_SESSION', 'sessions', id);
  };

  const saveLegislator = async (legislator) => {
    const id = await dbService.saveLegislator(legislator);
    await loadLegislators();
    await logAction(legislator.id ? 'UPDATE_LEGISLATOR' : 'CREATE_LEGISLATOR', 'legislators', id || legislator.id, legislator);
    return id || legislator.id;
  };
  const deleteLegislator = async (id) => {
    await dbService.deleteLegislator(id);
    await loadLegislators();
    await logAction('DELETE_LEGISLATOR', 'legislators', id);
  };

  const saveCommission = async (commission) => {
    const id = await dbService.saveCommission(commission);
    await loadCommissions();
    await logAction(commission.id ? 'UPDATE_COMMISSION' : 'CREATE_COMMISSION', 'commissions', id || commission.id, commission);
    return id || commission.id;
  };
  const deleteCommission = async (id) => {
    await dbService.deleteCommission(id);
    await loadCommissions();
    await logAction('DELETE_COMMISSION', 'commissions', id);
  };

  const saveOficio = async (oficio) => {
    const id = await dbService.saveOficio(oficio);
    await loadOficios();
    await logAction(oficio.id ? 'UPDATE_OFICIO' : 'CREATE_OFICIO', 'oficios', id || oficio.id, oficio);
    return id || oficio.id;
  };
  const deleteOficio = async (id) => {
    await dbService.deleteOficio(id);
    await loadOficios();
    await logAction('DELETE_OFICIO', 'oficios', id);
  };

  const saveProject = async (project) => {
    const id = await dbService.saveProject(project);
    await loadProjects();
    await logAction(project.id ? 'UPDATE_PROJECT' : 'CREATE_PROJECT', 'projects', id || project.id, project);
    return id || project.id;
  };
  const deleteProject = async (id) => {
    await dbService.deleteProject(id);
    await loadProjects();
    await logAction('DELETE_PROJECT', 'projects', id);
  };

  const saveAgreement = async (agreement) => {
    const id = await dbService.saveAgreement(agreement);
    await loadAgreements();
    await logAction(agreement.id ? 'UPDATE_AGREEMENT' : 'CREATE_AGREEMENT', 'agreements', id || agreement.id, agreement);
    return id || agreement.id;
  };
  const deleteAgreement = async (id) => {
    await dbService.deleteAgreement(id);
    await loadAgreements();
    await logAction('DELETE_AGREEMENT', 'agreements', id);
  };

  const saveDocument = async (document) => {
    const id = await dbService.saveDocument(document);
    await loadDocuments();
    await logAction('CREATE_DOCUMENT', 'documents', id, { nombre: document.nombreOriginal });
    return id || document.id;
  };
  const deleteDocument = async (id) => {
    await dbService.deleteDocument(id);
    await loadDocuments();
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
    laws, loadLaws,
    agreements, saveAgreement, deleteAgreement,
    documents, saveDocument, deleteDocument,
    auditLogs,
    getProjectVersions,
    isLoading, reload: loadAllData
  };
};
