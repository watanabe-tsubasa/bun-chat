import { mkdirSync } from "fs";
import { dirname } from "path";
import { Database } from "bun:sqlite";

export type ChatMessage = {
  id: number;
  name: string;
  message: string;
  ts: number;
};

const DEFAULT_DB_PATH = process.env.DB_PATH ?? "./data/app.db";
let dbPath = DEFAULT_DB_PATH;
let db: Database | null = null;

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  ts INTEGER NOT NULL
);`;

function ensureDataDir(path: string) {
  mkdirSync(dirname(path), { recursive: true });
}

function secondsSinceEpoch(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 1000);
}

function startOfTodaySeconds(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return secondsSinceEpoch(now);
}

function pruneOldMessages(database: Database) {
  const cutoff = startOfTodaySeconds();
  const stmt = database.prepare("DELETE FROM messages WHERE ts < ?");
  stmt.run(cutoff);
}

function openDatabase(path: string) {
  ensureDataDir(path);
  const database = new Database(path, { create: true });
  database.exec(CREATE_TABLE_SQL);
  pruneOldMessages(database);
  return database;
}

export function getDb(path?: string): Database {
  const targetPath = path ?? dbPath ?? DEFAULT_DB_PATH;
  if (db && dbPath === targetPath) return db;
  if (db) {
    db.close();
    db = null;
  }
  dbPath = targetPath;
  db = openDatabase(targetPath);
  return db;
}

export function resetDb(path?: string): Database {
  const targetPath = path ?? dbPath ?? DEFAULT_DB_PATH;
  if (db) {
    db.close();
    db = null;
  }
  dbPath = targetPath;
  return getDb(targetPath);
}

export function insertMessage(input: { name: string; message: string; ts?: number }) {
  const database = getDb();
  const ts = input.ts ?? secondsSinceEpoch();
  const stmt = database.prepare(
    "INSERT INTO messages (name, message, ts) VALUES ($name, $message, $ts)",
  );
  stmt.run({
    $name: input.name,
    $message: input.message,
    $ts: ts,
  });
}

export function fetchLatestMessages(limit = 5): ChatMessage[] {
  const database = getDb();
  const stmt = database.prepare(
    "SELECT id, name, message, ts FROM messages ORDER BY ts DESC LIMIT ?",
  );
  return stmt.all(limit) as ChatMessage[];
}
