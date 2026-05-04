CREATE TABLE IF NOT EXISTS `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sesion_id` integer,
	`legislador_id` integer,
	`presente` integer DEFAULT 0,
	`timestamp` text,
	FOREIGN KEY (`sesion_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`legislador_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text DEFAULT 'CURRENT_TIMESTAMP',
	`level` text,
	`userId` text,
	`action` text,
	`entity_type` text,
	`entity_id` integer,
	`changes` text,
	`signature` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `commissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`presidente_id` integer,
	`vicepresidente_id` integer,
	`miembro_1_id` integer,
	`miembro_2_id` integer,
	`miembro_3_id` integer,
	`miembro_3_nombre` text,
	`activo` integer DEFAULT 1,
	FOREIGN KEY (`presidente_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vicepresidente_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`miembro_1_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`miembro_2_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`miembro_3_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entidad_tipo` text,
	`entidad_id` integer,
	`fase_etiqueta` text,
	`ruta_archivo` text,
	`nombre_original` text,
	`tipo_mime` text,
	`tamano_bytes` integer,
	`hash_integridad` text,
	`fecha_subida` text,
	`contenido_base64` text,
	`activo` integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `laws` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text,
	`gaceta` text,
	`tipo` text,
	`anio` integer,
	`fecha_vigencia` text,
	`ruta_pdf` text,
	`qr_data` text,
	`descargas` integer DEFAULT 0,
	`activo` integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `legislators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`partido_politico` text,
	`contacto` text,
	`notas` text,
	`activo` integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `oficios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`numero_oficio` text,
	`fecha` text NOT NULL,
	`organo_receptor` text,
	`asunto` text,
	`sesion_id` integer,
	`activo` integer DEFAULT 1,
	FOREIGN KEY (`sesion_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `oficios_numero_oficio_unique` ON `oficios` (`numero_oficio`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `project_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`version_label` text,
	`mensaje` text,
	`snapshot` text,
	`fecha_creacion` text,
	`autor` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`origen` text,
	`comision_id` integer,
	`ponente_id` integer,
	`fase_actual` text,
	`urgencia_parlamentaria` integer DEFAULT 0,
	`fecha_ingreso` text,
	`fecha_actualizacion` text,
	`activo` integer DEFAULT 1,
	FOREIGN KEY (`comision_id`) REFERENCES `commissions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ponente_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo` text NOT NULL,
	`numero_correlativo` text,
	`motivo` text,
	`fecha` text NOT NULL,
	`hora_inicio` text,
	`hora_cierre` text,
	`periodo` text,
	`observaciones` text,
	`activo` integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'legislador',
	`nombre_completo` text,
	`ultimo_login` text,
	`activo` integer DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_username_unique` ON `users` (`username`);