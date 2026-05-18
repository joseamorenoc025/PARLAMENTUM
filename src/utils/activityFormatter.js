/**
 * Formateador de Actividad del Sistema (Bitácora Humanizada)
 * Convierte eventos técnicos y datos crudos de SQLite a oraciones elegantes, comprensibles y formales en español.
 */

export const formatActivity = (action, entityType, entityId, changesJson) => {
  let data = null;
  if (changesJson) {
    try {
      data = typeof changesJson === 'string' ? JSON.parse(changesJson) : changesJson;
    } catch (e) {
      console.warn('Error parseando cambios en bitácora:', e);
    }
  }

  const act = (action || '').toUpperCase();
  const ent = (entityType || '').toLowerCase();

  // Caso: Configuración del Sistema
  if (ent === 'system') {
    if (act.includes('UPDATE')) {
      const sec = data?.nombreSecretario || 'No asignado';
      const leg = data?.legislaturaActiva || 'N/A';
      return `Se actualizó la configuración global del sistema legislativo. Secretario General asignado: "${sec}", Legislatura activa: "${leg}".`;
    }
    return `Se modificó la configuración general del sistema administrativo.`;
  }

  // Caso: Sesiones Legislativas
  if (ent === 'sessions' || ent === 'session') {
    if (act.includes('CREATE')) {
      const num = data?.numero || 'N/A';
      const tipo = data?.tipoSesion || 'Ordinaria';
      const fecha = data?.fechaSesion ? new Date(data.fechaSesion).toLocaleDateString('es-ES') : 'N/A';
      return `Se convocó y registró la Sesión Legislativa ${tipo} N° ${num}, programada para llevarse a cabo el día ${fecha}.`;
    }
    if (act.includes('UPDATE')) {
      const num = data?.numero || 'N/A';
      const tipo = data?.tipoSesion || 'Ordinaria';
      return `Se modificaron los datos y la planificación de la Sesión Legislativa N° ${num} (${tipo}).`;
    }
    if (act.includes('DELETE')) {
      return `Se canceló y eliminó de la agenda general la Sesión Legislativa registrada bajo el consecutivo ID ${entityId || 'N/A'}.`;
    }
  }

  // Caso: Legisladores
  if (ent === 'legislators' || ent === 'legislator') {
    if (act.includes('CREATE')) {
      const nom = data?.nombre || 'Legislador';
      const part = data?.partidoPolitico || 'Independiente';
      const rol = data?.rolCamara || 'Diputado';
      return `Se incorporó formalmente a la base parlamentaria al legislador "${nom}" del partido "${part}", asumiendo el cargo de "${rol}".`;
    }
    if (act.includes('UPDATE')) {
      const nom = data?.nombre || 'Legislador';
      const part = data?.partidoPolitico || 'Independiente';
      return `Se actualizaron las credenciales y datos del parlamentario "${nom}" ("${part}").`;
    }
    if (act.includes('DELETE')) {
      return `Se dio de baja del sistema legislativo al parlamentario asociado al ID ${entityId || 'N/A'}.`;
    }
  }

  // Caso: Comisiones
  if (ent === 'commissions' || ent === 'commission') {
    if (act.includes('CREATE')) {
      const nom = data?.nombre || 'Comisión';
      const tipo = data?.tipo || 'Permanente';
      return `Se constituyó la Comisión Legislativa "${nom}" de naturaleza "${tipo}" para organizar las tareas de debate legislativo.`;
    }
    if (act.includes('UPDATE')) {
      const nom = data?.nombre || 'Comisión';
      return `Se modificó la estructura, integrantes o definición de la Comisión Legislativa "${nom}".`;
    }
    if (act.includes('DELETE')) {
      return `Se disolvió y eliminó del registro de comisiones la Comisión Legislativa bajo el ID ${entityId || 'N/A'}.`;
    }
  }

  // Caso: Oficios Salientes
  if (ent === 'oficios' || ent === 'oficio') {
    if (act.includes('CREATE')) {
      const num = data?.numeroOficio || 'Sin número';
      const dest = data?.destinatario || 'Sin destinatario';
      const asu = data?.asunto || 'Asunto general';
      return `Se redactó y registró el Oficio Oficial de Salida N° ${num}, dirigido a "${dest}", con el asunto: "${asu}".`;
    }
    if (act.includes('UPDATE')) {
      const num = data?.numeroOficio || 'Sin número';
      const dest = data?.destinatario || 'Sin destinatario';
      return `Se actualizó la redacción y los metadatos del Oficio N° ${num} remitido a "${dest}".`;
    }
    if (act.includes('DELETE')) {
      return `Se retiró y desincorporó el registro de Oficio N° ${entityId || 'N/A'} del archivo general.`;
    }
  }

  // Caso: Proyectos de Ley (Agenda Legislativa)
  if (ent === 'projects' || ent === 'project') {
    if (act.includes('CREATE')) {
      const tit = data?.titulo || 'Proyecto sin título';
      const orig = data?.origen || 'No especificado';
      return `Se recibió e ingresó a trámite parlamentario el Proyecto de Ley titulado: "${tit}", originado en: ${orig}.`;
    }
    if (act.includes('UPDATE')) {
      const tit = data?.titulo || 'Proyecto sin título';
      const fase = data?.faseActual || 'Recepción';
      return `Se actualizó el expediente del Proyecto de Ley "${tit}". Actualmente se sitúa en la fase de: "${fase}".`;
    }
    if (act.includes('DELETE')) {
      return `Se anuló y archivó definitivamente el expediente del Proyecto de Ley con ID ${entityId || 'N/A'}.`;
    }
  }

  // Caso: Acuerdos de Cámara
  if (ent === 'agreements' || ent === 'agreement') {
    if (act.includes('CREATE')) {
      const num = data?.numeroAcuerdo || 'N/A';
      const tit = data?.titulo || 'Acuerdo de Cámara';
      return `Se debatió y aprobó formalmente el Acuerdo de Cámara N° ${num}: "${tit}".`;
    }
    if (act.includes('UPDATE')) {
      const num = data?.numeroAcuerdo || 'N/A';
      return `Se modificaron los términos redactados del Acuerdo de Cámara N° ${num}.`;
    }
    if (act.includes('DELETE')) {
      return `Se anuló la validez del registro de Acuerdo de Cámara con ID ${entityId || 'N/A'}.`;
    }
  }

  // Caso: Bóveda Documental (Ingesta de archivos)
  if (ent === 'documents' || ent === 'document') {
    if (act.includes('CREATE')) {
      const nom = data?.nombre || 'documento.pdf';
      return `Se cargó y resguardó el archivo digital "${nom}" de manera permanente en la Bóveda Criptográfica de la Cámara.`;
    }
    if (act.includes('DELETE')) {
      return `Se eliminó el soporte de archivo físico con ID ${entityId || 'N/A'} de la Bóveda Documental.`;
    }
  }

  // Caso por defecto
  const actionLabel = act.replace('_', ' ');
  return `Operación "${actionLabel}" realizada con éxito sobre el módulo de ${entityType || 'General'} (Registro ID: ${entityId || 'N/A'}).`;
};
