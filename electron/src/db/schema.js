import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Configuración global de la aplicación
export const config = sqliteTable('config', {
  key: text('key').primaryKey(),
  value: text('value'),
});

// Auditoría inmutable
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').default('CURRENT_TIMESTAMP'),
  level: text('level'),
  userId: text('userId'),
  action: text('action'),
  entityType: text('entity_type'),
  entityId: integer('entity_id'),
  changes: text('changes'),
  signature: text('signature'),
});

// Legisladores
export const legislators = sqliteTable('legislators', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  partidoPolitico: text('partido_politico'),
  contacto: text('contacto'),
  notas: text('notas'),
  activo: integer('activo').default(1),
});

// Gestión de Usuarios (RBAC)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('legislador'), // admin, secretario, legislador, viewer
  nombreCompleto: text('nombre_completo'),
  ultimoLogin: text('ultimo_login'),
  activo: integer('activo').default(1),
});

// Comisiones
export const commissions = sqliteTable('commissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  presidenteId: integer('presidente_id').references(() => legislators.id),
  vicepresidenteId: integer('vicepresidente_id').references(() => legislators.id),
  miembro1Id: integer('miembro_1_id').references(() => legislators.id),
  miembro2Id: integer('miembro_2_id').references(() => legislators.id),
  miembro3Id: integer('miembro_3_id').references(() => legislators.id),
  miembro3Nombre: text('miembro_3_nombre'),
  activo: integer('activo').default(1),
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
  activo: integer('activo').default(1),
});

// Asistencia a Sesiones
export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sesionId: integer('sesion_id').references(() => sessions.id),
  legisladorId: integer('legislador_id').references(() => legislators.id),
  presente: integer('presente').default(0),
  timestamp: text('timestamp'),
});

// Oficios Salientes
export const oficios = sqliteTable('oficios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numeroOficio: text('numero_oficio').unique(),
  fecha: text('fecha').notNull(),
  organoReceptor: text('organo_receptor'),
  asunto: text('asunto'),
  sesionId: integer('sesion_id').references(() => sessions.id),
  activo: integer('activo').default(1),
});

// Proyectos de Ley
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  titulo: text('titulo').notNull(),
  origen: text('origen'), // Comisión, Gobernación, Votantes
  comisionId: integer('comision_id').references(() => commissions.id),
  ponenteId: integer('ponente_id').references(() => legislators.id),
  faseActual: text('fase_actual'),
  urgenciaParlamentaria: integer('urgencia_parlamentaria').default(0),
  fechaIngreso: text('fecha_ingreso'),
  fechaActualizacion: text('fecha_actualizacion'),
  activo: integer('activo').default(1),
});

// Versiones de Proyectos
export const projectVersions = sqliteTable('project_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').references(() => projects.id),
  versionLabel: text('version_label'),
  mensaje: text('mensaje'),
  snapshot: text('snapshot'),
  fechaCreacion: text('fecha_creacion'),
  autor: text('autor'),
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

// Biblioteca de Leyes Sancionadas
export const laws = sqliteTable('laws', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre'),
  gaceta: text('gaceta'),
  tipo: text('tipo'),
  anio: integer('anio'),
  fechaVigencia: text('fecha_vigencia'),
  rutaPdf: text('ruta_pdf'),
  qrData: text('qr_data'),
  descargas: integer('descargas').default(0),
  activo: integer('activo').default(1),
});
