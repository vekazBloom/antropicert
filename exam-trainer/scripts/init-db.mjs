#!/usr/bin/env node
/**
 * Applies db/schema.sql to the database in DATABASE_URL.
 *
 * Safe to run repeatedly — every statement is CREATE ... IF NOT EXISTS.
 *   node --env-file=.env.local scripts/init-db.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const HERE = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;

if (!url) {
  console.error(
    'DATABASE_URL is not set.\n' +
      'Copy .env.example to .env.local, paste your Supabase connection string, then run:\n' +
      '  node --env-file=.env.local scripts/init-db.mjs'
  );
  process.exit(1);
}

const schema = readFileSync(join(HERE, '..', 'db', 'schema.sql'), 'utf8');
const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 20 });

try {
  await sql.unsafe(schema);
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name IN ('users', 'attempts', 'answers')
     ORDER BY table_name
  `;
  console.log('schema applied. tables present:', tables.map((t) => t.table_name).join(', '));
} catch (e) {
  console.error('failed to apply schema:', e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
