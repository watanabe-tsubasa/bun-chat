import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { fetchLatestMessages, insertMessage, resetDb } from "./db";

const tempDirs: string[] = [];
let currentPath: string;

function newDbPath() {
  const dir = mkdtempSync(join(tmpdir(), "bun-chat-db-"));
  tempDirs.push(dir);
  return join(dir, "test.db");
}

beforeEach(() => {
  currentPath = newDbPath();
  resetDb(currentPath);
});

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("database helpers", () => {
  it("orders messages by ts desc and limits to 5", () => {
    for (let i = 1; i <= 7; i++) {
      insertMessage({ name: `user${i}`, message: `msg${i}`, ts: i });
    }
    const latest = fetchLatestMessages();
    expect(latest.length).toBe(5);
    expect(latest[0]!.ts).toBe(7);
    expect(latest[4]!.ts).toBe(3);
  });

  it("prunes messages from previous days on startup", () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const startOfTodaySeconds = Math.floor(new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000);
    const yesterdayTs = startOfTodaySeconds - 10;

    insertMessage({ name: "old", message: "yesterday", ts: yesterdayTs });
    insertMessage({ name: "today", message: "hello", ts: nowSeconds });

    resetDb(currentPath);

    const messages = fetchLatestMessages();
    expect(messages.length).toBe(1);
    expect(messages[0]!.name).toBe("today");
  });
});
