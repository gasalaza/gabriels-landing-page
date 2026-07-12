import type Database from 'better-sqlite3';
import { openDatabase } from './database.js';

export type ProjectType = 'landing' | 'fullstack' | 'consult' | 'other';

export interface ContactSubmissionInput {
  name: string;
  email: string;
  projectType: ProjectType;
  message: string;
}

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  projectType: ProjectType;
  message: string;
  createdAt: string;
  read: boolean;
}

interface ContactSubmissionRow {
  id: number;
  name: string;
  email: string;
  project_type: ProjectType;
  message: string;
  created_at: string;
  read: 0 | 1;
}

function mapSubmission(row: ContactSubmissionRow): ContactSubmission {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    projectType: row.project_type,
    message: row.message,
    createdAt: row.created_at,
    read: row.read === 1,
  };
}

function withDatabase<T>(work: (database: Database.Database) => T): T {
  const database = openDatabase();
  try {
    return work(database);
  } finally {
    database.close();
  }
}

export function insertSubmission(input: ContactSubmissionInput): number {
  return withDatabase((database) => {
    const result = database
      .prepare(
        `INSERT INTO contact_submissions (name, email, project_type, message)
         VALUES (@name, @email, @projectType, @message)`,
      )
      .run(input);

    return Number(result.lastInsertRowid);
  });
}

const DEFAULT_LIST_LIMIT = 500;

export function listSubmissions(limit: number = DEFAULT_LIST_LIMIT): ContactSubmission[] {
  return withDatabase((database) => {
    const rows = database
      .prepare(
        `SELECT id, name, email, project_type, message, created_at, read
         FROM contact_submissions
         ORDER BY datetime(created_at) DESC, id DESC
         LIMIT ?`,
      )
      .all(limit) as ContactSubmissionRow[];

    return rows.map(mapSubmission);
  });
}

export function getSubmission(id: number): ContactSubmission | null {
  return withDatabase((database) => {
    const row = database
      .prepare(
        `SELECT id, name, email, project_type, message, created_at, read
         FROM contact_submissions
         WHERE id = ?`,
      )
      .get(id) as ContactSubmissionRow | undefined;

    return row ? mapSubmission(row) : null;
  });
}

export function countRecentSubmissions(withinHours = 24): number {
  return withDatabase((database) => {
    const row = database
      .prepare(
        `SELECT COUNT(*) AS c FROM contact_submissions
         WHERE datetime(created_at) > datetime('now', ? || ' hours')`,
      )
      .get(`-${withinHours}`) as { c: number };
    return row.c;
  });
}

export function markRead(id: number): boolean {
  return withDatabase((database) => {
    const result = database.prepare('UPDATE contact_submissions SET read = 1 WHERE id = ?').run(id);
    return result.changes > 0;
  });
}
