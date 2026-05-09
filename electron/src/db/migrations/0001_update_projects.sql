ALTER TABLE `projects` ADD `fase_actual` text DEFAULT 'Estudio en Comisión';
ALTER TABLE `projects` ADD `link_1ra_discusion` text;
ALTER TABLE `projects` ADD `link_consulta_publica` text;
ALTER TABLE `projects` ADD `link_2da_discusion` text;
ALTER TABLE `projects` ADD `link_3ra_discusion` text;
ALTER TABLE `projects` ADD `fecha_consulta_publica` text;
ALTER TABLE `projects` ADD `urgencia_parlamentaria` integer DEFAULT 0;
ALTER TABLE `projects` ADD `fecha_ingreso` text;
ALTER TABLE `projects` ADD `fecha_actualizacion` text DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE `agreements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`numero_correlativo` text,
	`fecha` text NOT NULL,
	`objeto` text NOT NULL,
	`sesion_id` integer,
	`drive_link` text,
	`activo` integer DEFAULT 1,
	FOREIGN KEY (`sesion_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `agreements_numero_correlativo_unique` ON `agreements` (`numero_correlativo`);
