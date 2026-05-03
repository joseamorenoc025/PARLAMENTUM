// Esquema completo de la base de datos para Segundo Cerebro Legislativo
export const schema = `
  -- Configuración global de la aplicación
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  -- Auditoría inmutable
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    level TEXT,
    userId TEXT,
    action TEXT,
    entity_type TEXT,
    entity_id INTEGER,
    changes TEXT,
    signature TEXT
  );

  -- Legisladores
  CREATE TABLE IF NOT EXISTS legislators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    partido_politico TEXT,
    contacto TEXT,
    notas TEXT,
    activo INTEGER DEFAULT 1
  );

  -- Gestión de Usuarios (RBAC)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'legislador', -- admin, secretario, legislador, viewer
    nombre_completo TEXT,
    ultimo_login TEXT,
    activo INTEGER DEFAULT 1
  );

  -- Comisiones (Estructura Ampliada)
  CREATE TABLE IF NOT EXISTS commissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    presidente_id INTEGER,
    vicepresidente_id INTEGER,
    miembro_1_id INTEGER,
    miembro_2_id INTEGER,
    miembro_3_id INTEGER,
    miembro_3_nombre TEXT, -- Para ciudadanos no legisladores
    activo INTEGER DEFAULT 1,
    FOREIGN KEY(presidente_id) REFERENCES legislators(id),
    FOREIGN KEY(vicepresidente_id) REFERENCES legislators(id),
    FOREIGN KEY(miembro_1_id) REFERENCES legislators(id),
    FOREIGN KEY(miembro_2_id) REFERENCES legislators(id),
    FOREIGN KEY(miembro_3_id) REFERENCES legislators(id)
  );

  -- Sesiones Legislativas
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL, -- Ordinaria, Extraordinaria, Especial, Solemne, Instalación
    numero_correlativo TEXT,
    motivo TEXT,
    fecha TEXT NOT NULL,
    hora_inicio TEXT,
    hora_cierre TEXT,
    periodo TEXT,
    observaciones TEXT,
    activo INTEGER DEFAULT 1
  );

  -- Asistencia a Sesiones
  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sesion_id INTEGER,
    legislador_id INTEGER,
    presente INTEGER DEFAULT 0,
    timestamp TEXT,
    FOREIGN KEY(sesion_id) REFERENCES sessions(id),
    FOREIGN KEY(legislador_id) REFERENCES legislators(id)
  );

  -- Oficios Salientes
  CREATE TABLE IF NOT EXISTS oficios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_oficio TEXT UNIQUE,
    fecha TEXT NOT NULL,
    organo_receptor TEXT,
    asunto TEXT,
    sesion_id INTEGER,
    activo INTEGER DEFAULT 1,
    FOREIGN KEY(sesion_id) REFERENCES sessions(id)
  );

  -- Proyectos de Ley
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    origen TEXT, -- Comisión, Gobernación, Votantes
    comision_id INTEGER,
    ponente_id INTEGER,
    fase_actual TEXT,
    urgencia_parlamentaria INTEGER DEFAULT 0,
    fecha_ingreso TEXT,
    fecha_actualizacion TEXT,
    activo INTEGER DEFAULT 1,
    FOREIGN KEY(comision_id) REFERENCES commissions(id),
    FOREIGN KEY(ponente_id) REFERENCES legislators(id)
  );

  -- Versiones de Proyectos (Historial)
  CREATE TABLE IF NOT EXISTS project_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    version_label TEXT,
    mensaje TEXT,
    snapshot TEXT, -- JSON completo del proyecto en ese momento
    fecha_creacion TEXT,
    autor TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  -- Bóveda Documental
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidad_tipo TEXT, -- Sesion, Oficio, ProyectoLey
    entidad_id INTEGER,
    fase_etiqueta TEXT,
    ruta_archivo TEXT,
    nombre_original TEXT,
    tipo_mime TEXT,
    tamano_bytes INTEGER,
    hash_integridad TEXT,
    fecha_subida TEXT,
    contenido_base64 TEXT, -- Opcional, para demo/fallback
    activo INTEGER DEFAULT 1
  );

  -- Biblioteca de Leyes Sancionadas (QR)
  CREATE TABLE IF NOT EXISTS laws (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    gaceta TEXT,
    tipo TEXT,
    anio INTEGER,
    fecha_vigencia TEXT,
    ruta_pdf TEXT,
    qr_data TEXT,
    descargas INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1
  );
`;
