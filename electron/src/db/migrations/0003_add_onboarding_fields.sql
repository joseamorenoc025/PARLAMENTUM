ALTER TABLE `users` ADD `security_question` text;--> statement-breakpoint
ALTER TABLE `users` ADD `security_answer_hash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `recovery_code_hash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `password_reset_required` integer DEFAULT 0;