CREATE TABLE `minutes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer,
	`contenido` text,
	`firmada` integer DEFAULT 0,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `laws` ADD `drive_link` text;--> statement-breakpoint
ALTER TABLE `oficios` ADD `contenido` text;--> statement-breakpoint
ALTER TABLE `oficios` ADD `vinculado_a` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `orden_dia` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `acta_pdf` text;--> statement-breakpoint
ALTER TABLE `users` ADD `created_at` text DEFAULT 'CURRENT_TIMESTAMP';