ALTER TABLE `projects` ADD `origen` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `fase_actual` text DEFAULT 'Estudio en Comisión';--> statement-breakpoint
ALTER TABLE `projects` ADD `urgencia_parlamentaria` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `projects` ADD `fecha_ingreso` text;