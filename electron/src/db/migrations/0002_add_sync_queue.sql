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
