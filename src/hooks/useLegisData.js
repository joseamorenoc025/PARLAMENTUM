import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';

export const useLegisData = (defaultConfig) => {
  const [config, setConfig] = useState(defaultConfig);
  const [sessions, setSessions] = useState([]);
  const [legislators, setLegislators] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [oficios, setOficios] = useState([]);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        dbConfig,
        dbSessions,
        dbLegislators,
        dbCommissions,
        dbOficios,
        dbProjects,
        dbDocuments
      ] = await Promise.all([
        dbService.getConfig(),
        dbService.getSessions(),
        dbService.getLegislators(),
        dbService.getCommissions(),
        dbService.getOficios(),
        dbService.getProjects(),
        dbService.getDocuments()
      ]);

      setConfig(prev => ({ ...prev, ...dbConfig }));
      setSessions(dbSessions);
      setLegislators(dbLegislators);
      setCommissions(dbCommissions);
      setOficios(dbOficios);
      setProjects(dbProjects);
      setDocuments(dbDocuments);
    } catch (err) {
      console.error('Error loading data from SQLite:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Actions
  const updateConfig = async (newConfig) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    await dbService.saveConfig(updated);
  };

  const saveSession = async (session) => {
    await dbService.saveSession(session);
    setSessions(await dbService.getSessions());
  };

  const deleteSession = async (id) => {
    await dbService.deleteSession(id);
    setSessions(await dbService.getSessions());
  };

  const saveLegislator = async (legislator) => {
    await dbService.saveLegislator(legislator);
    setLegislators(await dbService.getLegislators());
  };

  const deleteLegislator = async (id) => {
    await dbService.deleteLegislator(id);
    setLegislators(await dbService.getLegislators());
  };

  const saveCommission = async (commission) => {
    await dbService.saveCommission(commission);
    setCommissions(await dbService.getCommissions());
  };

  const deleteCommission = async (id) => {
    await dbService.deleteCommission(id);
    setCommissions(await dbService.getCommissions());
  };

  const saveOficio = async (oficio) => {
    await dbService.saveOficio(oficio);
    setOficios(await dbService.getOficios());
  };

  const deleteOficio = async (id) => {
    await dbService.deleteOficio(id);
    setOficios(await dbService.getOficios());
  };

  const saveProject = async (project) => {
    await dbService.saveProject(project);
    setProjects(await dbService.getProjects());
  };

  const deleteProject = async (id) => {
    await dbService.deleteProject(id);
    setProjects(await dbService.getProjects());
  };

  const saveDocument = async (document) => {
    await dbService.saveDocument(document);
    setDocuments(await dbService.getDocuments());
  };

  const deleteDocument = async (id) => {
    await dbService.deleteDocument(id);
    setDocuments(await dbService.getDocuments());
  };

  return {
    config, setConfig: updateConfig,
    sessions, saveSession, deleteSession,
    legislators, saveLegislator, deleteLegislator,
    commissions, saveCommission, deleteCommission,
    oficios, saveOficio, deleteOficio,
    projects, saveProject, deleteProject,
    documents, saveDocument, deleteDocument,
    isLoading, reload: loadAllData
  };
};
