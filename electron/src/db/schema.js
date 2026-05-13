import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Configuración global de la aplicación
export const config = sqliteTable('config', {
  key: text('key').primaryKey(),
  value: text('value'),
});

// Auditoría para trazabilidad de documentos
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
  level: text('level'),
  userId: text('userId'),
  action: text('action'),
  entityType: text('entity_type'),
  entityId: integer('entity_id'),
  changes: text('changes'),
  signature: text('signature'),
});

// Gestión de Usuarios (Simplificado: Único registro para Secretario de Cámara)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
<  role: text('role').default('admin'),
  nombreCompleto: text('nombre_completo'),
  ultimoLogin: text('ultimo_login'),
  securityQuestion: text('security_question'),
  securityAnswerHash: text('security_answer_hash'),
  recoveryCodeHash: text('recovery_code_hash'),
  passwordResetRequired: integer('password_reset_required').default(0),
  activo: integer('activo').default(1),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Sesiones Legislativas
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tipo: text('tipo').notNull(),
  numeroCorrelativo: text('numero_correlativo'),
  motivo: text('motivo'),
  fecha: text('fecha').notNull(),
  horaInicio: text('hora_inicio'),
  horaCierre: text('hora_cierre'),
  periodo: text('periodo'),
  observaciones: text('observaciones'),
  ordenDia: text('orden_dia'),
  actaPdf: text('acta_pdf'),
  activo: integer('activo').default(1),
});

// Actas de Sesión (Minutes)
export const minutes = sqliteTable('minutes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').references(() => sessions.id),
  contenido: text('contenido'),
  firmada: integer('firmada').default(0), // 0: no, 1: sí
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Oficios Salientes
export const oficios = sqliteTable('oficios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numeroOficio: text('numero_oficio').unique(),
  fecha: text('fecha').notNull(),
  organoReceptor: text('organo_receptor'),
  asunto: text('asunto'),
  contenido: text('contenido'),
  vinculadoA: text('vinculado_a'),
  sesionId: integer('sesion_id').references(() => sessions.id),
  activo: integer('activo').default(1),
});

// Biblioteca de Leyes Sancionadas
export const laws = sqliteTable('laws', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre'),
  titulo: text('titulo'),
  expediente: text('expediente'),
  gaceta: text('gaceta'),
  tipo: text('tipo'),
  numero: text('numero'),
  anio: integer('anio'),
  fechaVigencia: text('fecha_vigencia'),
  fechaPublicacion: text('fecha_publicacion'),
  rutaPdf: text('ruta_pdf'),
  qrData: text('qr_data'),
  descargas: integer('descargas').default(0),
  contenido: text('contenido'),
  fileHash: text('file_hash'),
  driveLink: text('drive_link'),
  activo: integer('activo').default(1),
});

// Legisladores (Re-añadido y Ampliado para "Conoce a tu Legislador")
export const legislators = sqliteTable('legislators', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  partidoPolitico: text('partido_politico'),
  contacto: text('contacto'),
  notas: text('notas'),
  biografia: text('biografia'),
  foto: text('foto'), // Base64 o link
  activo: integer('activo').default(1),
});

// Comisiones Legislativas
export const commissions = sqliteTable('commissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  presidenteId: integer('presidente_id').references(() => legislators.id),
  vicepresidenteId: integer('vicepresidente_id').references(() => legislators.id),
  miembro1Id: integer('miembro1_id').references(() => legislators.id),
  miembro2Id: integer('miembro2_id').references(() => legislators.id),
  miembro3Id: integer('miembro3_id').references(() => legislators.id),
  miembro3Nombre: text('miembro3_nombre'), // Para ciudadanos
  activo: integer('activo').default(1),
});

// Proyectos de Ley (Agenda Legislativa)
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  expediente: text('expediente'),
  titulo: text('titulo').notNull(),
  extracto: text('extracto'),
  origen: text('origen'),
  faseActual: text('fase_actual').default('Estudio en Comisión'),
  linkPrimeraDiscusion: text('link_1ra_discusion'),
  linkConsultaPublica: text('link_consulta_publica'),
  linkSegundaDiscusion: text('link_2da_discusion'),
  linkTerceraDiscusion: text('link_3ra_discusion'),
  fechaConsultaPublica: text('fecha_consulta_publica'),
  urgenciaParlamentaria: integer('urgencia_parlamentaria').default(0),
  fechaIngreso: text('fecha_ingreso'),
  ponenteId: integer('ponente_id').references(() => legislators.id),
  comisionId: integer('comision_id').references(() => commissions.id),
  estado: text('estado').default('en_comision'),
  prioridad: text('prioridad').default('media'),
  tags: text('tags'),
  ultimaActualizacion: text('ultima_actualizacion').default(sql`CURRENT_TIMESTAMP`),
  activo: integer('activo').default(1),
});

// Versiones/Snapshots de Proyectos
export const projectVersions = sqliteTable('project_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').references(() => projects.id),
  version: integer('version').notNull(),
  motivo: text('motivo'),
  snapshot: text('snapshot'), // JSON completo del estado
  fechaCreacion: text('fecha_creacion').default(sql`CURRENT_TIMESTAMP`),
});

// Bóveda Documental
export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entidadTipo: text('entidad_tipo'),
  entidadId: integer('entidad_id'),
  faseEtiqueta: text('fase_etiqueta'),
  rutaArchivo: text('ruta_archivo'),
  nombreOriginal: text('nombre_original'),
  tipoMime: text('tipo_mime'),
  tamanoBytes: integer('tamano_bytes'),
  hashIntegridad: text('hash_integridad'),
  fechaSubida: text('fecha_subida'),
  contenidoBase64: text('contenido_base64'),
  activo: integer('activo').default(1),
});

// Acuerdos de Cámara
export const agreements = sqliteTable('agreements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numeroCorrelativo: text('numero_correlativo').unique(),
  fecha: text('fecha').notNull(),
  objeto: text('objeto').notNull(),
  sesionId: integer('sesion_id').references(() => sessions.id),
  driveLink: text('drive_link'),
  activo: integer('activo').default(1),
});

// Cola de Sincronización
export const syncQueue = sqliteTable('sync_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').default('laws'),
  entityId: integer('entity_id'),
  action: text('action'),
  status: text('status').default('pending'),
  attempts: integer('attempts').default(0),
  lastError: text('last_error'),
  nextRetry: text('next_retry'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at'),
});

