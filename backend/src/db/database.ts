import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultDatabasePath = './data/portfolio.sqlite';
const currentDirectory = dirname(fileURLToPath(import.meta.url));

function resolveSchemaPath(): string {
  return resolve(currentDirectory, '../../src/db/schema.sql');
}

export function openDatabase(databasePath = process.env.SQLITE_DATABASE_PATH ?? defaultDatabasePath): Database.Database {
  const resolvedPath = resolve(databasePath);
  mkdirSync(dirname(resolvedPath), { recursive: true });

  const database = new Database(resolvedPath);
  const schema = readFileSync(resolveSchemaPath(), 'utf8');
  database.exec(schema);
  return database;
}
