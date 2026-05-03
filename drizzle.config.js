import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './electron/src/db/schema.js',
  out: './electron/src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'legis.db',
  },
});
