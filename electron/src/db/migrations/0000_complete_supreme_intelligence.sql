CREATE TABLE `audit_logs` (
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
CREATE TABLE `commissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`presidente_id` integer,
	`vicepresidente_id` integer,
	`miembro1_id` integer,
	`miembro2_id` integer,
	`miembro3_id` integer,
	`miembro3_nombre` text,
	`activo` integer DEFAULT 1,
	FOREIGN KEY (`presidente_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vicepresidente_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`miembro1_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`miembro2_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`miembro3_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `documents` (
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
CREATE TABLE `laws` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text,
	`titulo` text,
	`expediente` text,
	`gaceta` text,
	`tipo` text,
	`numero` text,
	`anio` integer,
	`fecha_vigencia` text,
	`fecha_publicacion` text,
	`ruta_pdf` text,
	`qr_data` text,
	`descargas` integer DEFAULT 0,
	`contenido` text,
	`file_hash` text,
	`drive_link` text,
	`activo` integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE `legislators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`partido_politico` text,
	`contacto` text,
	`notas` text,
	`biografia` text,
	`foto` text,
	`activo` integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE `minutes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer,
	`contenido` text,
	`firmada` integer DEFAULT 0,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `oficios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`numero_oficio` text,
	`fecha` text NOT NULL,
	`organo_receptor` text,
	`asunto` text,
	`contenido` text,
	`vinculado_a` text,
	`sesion_id` integer,
	`activo` integer DEFAULT 1,
	FOREIGN KEY (`sesion_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oficios_numero_oficio_unique` ON `oficios` (`numero_oficio`);--> statement-breakpoint
CREATE TABLE `project_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`version` integer NOT NULL,
	`motivo` text,
	`snapshot` text,
	`fecha_creacion` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`expediente` text,
	`titulo` text NOT NULL,
	`extracto` text,
	`fecha_presentacion` text,
	`ponente_id` integer,
	`comision_id` integer,
	`estado` text DEFAULT 'en_comision',
	`prioridad` text DEFAULT 'media',
	`tags` text,
	`ultima_actualizacion` text DEFAULT 'CURRENT_TIMESTAMP',
	`activo` integer DEFAULT 1,
	FOREIGN KEY (`ponente_id`) REFERENCES `legislators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`comision_id`) REFERENCES `commissions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo` text NOT NULL,
	`numero_correlativo` text,
	`motivo` text,
	`fecha` text NOT NULL,
	`hora_inicio` text,
	`hora_cierre` text,
	`periodo` text,
	`observaciones` text,
	`orden_dia` text,
	`acta_pdf` text,
	`activo` integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE `sync_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text DEFAULT 'laws',
	`entity_id` integer,
	`action` text,
	`status` text DEFAULT 'pending',
	`attempts` integer DEFAULT 0,
	`last_error` text,
	`next_retry` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user',
	`nombre_completo` text,
	`security_question` text,
	`security_answer_hash` text,
	`recovery_code_hash` text,
	`password_reset_required` integer DEFAULT 0,
	`ultimo_login` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`activo` integer DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);