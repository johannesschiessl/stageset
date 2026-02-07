import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";

const dbDir = join(homedir(), ".stageset");
const showsDir = join(dbDir, "shows");
mkdirSync(showsDir, { recursive: true });

let db: Database | null = null;
let stmts: ReturnType<typeof prepareStatements> | null = null;
let currentShowName: string | null = null;

function requireDb(): Database {
  if (!db) throw new Error("No show selected");
  return db;
}

function requireStmts() {
  if (!stmts) throw new Error("No show selected");
  return stmts;
}

function initializeSchema(database: Database) {
  database.run("PRAGMA journal_mode = WAL");
  database.run("PRAGMA foreign_keys = ON");
  database.run("PRAGMA synchronous = NORMAL");

  database.run(`CREATE TABLE IF NOT EXISTS mics (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  number  INTEGER NOT NULL UNIQUE,
  name    TEXT NOT NULL DEFAULT '',
  x       REAL NOT NULL DEFAULT 400,
  y       REAL NOT NULL DEFAULT 300
)`);

  database.run(`CREATE TABLE IF NOT EXISTS stage_elements (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  kind     TEXT NOT NULL,
  label    TEXT NOT NULL DEFAULT '',
  x        REAL NOT NULL DEFAULT 400,
  y        REAL NOT NULL DEFAULT 300,
  width    REAL NOT NULL DEFAULT 0,
  height   REAL NOT NULL DEFAULT 0,
  rotation REAL NOT NULL DEFAULT 0
)`);

  database.run(`CREATE TABLE IF NOT EXISTS zones (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT NOT NULL DEFAULT '',
  color  TEXT NOT NULL DEFAULT '#6B9FFF',
  x      REAL NOT NULL DEFAULT 200,
  y      REAL NOT NULL DEFAULT 200,
  width  REAL NOT NULL DEFAULT 200,
  height REAL NOT NULL DEFAULT 150
)`);

  database.run(`CREATE TABLE IF NOT EXISTS columns (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  type       TEXT NOT NULL CHECK(type IN ('mic','text')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0
)`);

  database.run(`CREATE TABLE IF NOT EXISTS songs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL DEFAULT '',
  artist     TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
)`);

  database.run(`CREATE TABLE IF NOT EXISTS cells (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id   INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  column_id INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  value     TEXT NOT NULL DEFAULT '',
  UNIQUE(song_id, column_id)
)`);

  database.run(`CREATE TABLE IF NOT EXISTS notification_presets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  label      TEXT NOT NULL,
  emoji      TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6B9FFF',
  sort_order INTEGER NOT NULL DEFAULT 0
)`);

  // Migration: add width/height to stage_elements if missing
  try {
    database.run(
      "ALTER TABLE stage_elements ADD COLUMN width REAL NOT NULL DEFAULT 0",
    );
  } catch {}
  try {
    database.run(
      "ALTER TABLE stage_elements ADD COLUMN height REAL NOT NULL DEFAULT 0",
    );
  } catch {}

  // Seed default columns if empty
  const columnCount = database
    .query("SELECT COUNT(*) as count FROM columns")
    .get() as { count: number };
  if (columnCount.count === 0) {
    const insertCol = database.prepare(
      "INSERT INTO columns (key, label, type, sort_order, is_default) VALUES (?, ?, ?, ?, 1)",
    );
    insertCol.run("microphones", "Microphones", "mic", 0);
    insertCol.run("monitor", "Monitor", "mic", 1);
    insertCol.run("notes", "Notes", "text", 2);
  }
}

function prepareStatements(database: Database) {
  return {
    allMics: database.prepare("SELECT * FROM mics ORDER BY number"),
    allElements: database.prepare("SELECT * FROM stage_elements ORDER BY id"),
    allZones: database.prepare("SELECT * FROM zones ORDER BY id"),
    allColumns: database.prepare(
      "SELECT * FROM columns ORDER BY sort_order, id",
    ),
    allSongs: database.prepare("SELECT * FROM songs ORDER BY sort_order, id"),
    allCells: database.prepare("SELECT * FROM cells"),
    allNotificationPresets: database.prepare(
      "SELECT * FROM notification_presets ORDER BY sort_order, id",
    ),

    insertMic: database.prepare(
      "INSERT INTO mics (number, name, x, y) VALUES ($number, $name, $x, $y)",
    ),
    updateMic: database.prepare(
      "UPDATE mics SET number = $number, name = $name, x = $x, y = $y WHERE id = $id",
    ),
    deleteMic: database.prepare("DELETE FROM mics WHERE id = $id"),

    insertElement: database.prepare(
      "INSERT INTO stage_elements (kind, label, x, y, width, height, rotation) VALUES ($kind, $label, $x, $y, $width, $height, $rotation)",
    ),
    updateElement: database.prepare(
      "UPDATE stage_elements SET kind = $kind, label = $label, x = $x, y = $y, width = $width, height = $height, rotation = $rotation WHERE id = $id",
    ),
    deleteElement: database.prepare(
      "DELETE FROM stage_elements WHERE id = $id",
    ),

    insertZone: database.prepare(
      "INSERT INTO zones (name, color, x, y, width, height) VALUES ($name, $color, $x, $y, $width, $height)",
    ),
    updateZone: database.prepare(
      "UPDATE zones SET name = $name, color = $color, x = $x, y = $y, width = $width, height = $height WHERE id = $id",
    ),
    deleteZone: database.prepare("DELETE FROM zones WHERE id = $id"),

    insertColumn: database.prepare(
      "INSERT INTO columns (key, label, type, sort_order, is_default) VALUES ($key, $label, $type, $sort_order, 0)",
    ),
    updateColumn: database.prepare(
      "UPDATE columns SET label = $label, type = $type WHERE id = $id",
    ),
    deleteColumn: database.prepare(
      "DELETE FROM columns WHERE id = $id AND is_default = 0",
    ),
    updateColumnOrder: database.prepare(
      "UPDATE columns SET sort_order = $sort_order WHERE id = $id",
    ),

    insertSong: database.prepare(
      "INSERT INTO songs (title, artist, sort_order) VALUES ($title, $artist, $sort_order)",
    ),
    updateSong: database.prepare(
      "UPDATE songs SET title = $title, artist = $artist WHERE id = $id",
    ),
    deleteSong: database.prepare("DELETE FROM songs WHERE id = $id"),
    updateSongOrder: database.prepare(
      "UPDATE songs SET sort_order = $sort_order WHERE id = $id",
    ),
    maxSongOrder: database.prepare(
      "SELECT COALESCE(MAX(sort_order), -1) as max_order FROM songs",
    ),
    maxColumnOrder: database.prepare(
      "SELECT COALESCE(MAX(sort_order), -1) as max_order FROM columns",
    ),
    maxNotificationPresetOrder: database.prepare(
      "SELECT COALESCE(MAX(sort_order), -1) as max_order FROM notification_presets",
    ),
    getNotificationPresetById: database.prepare(
      "SELECT * FROM notification_presets WHERE id = ?",
    ),
    insertNotificationPreset: database.prepare(
      "INSERT INTO notification_presets (label, emoji, color, sort_order) VALUES ($label, $emoji, $color, $sort_order)",
    ),
    updateNotificationPreset: database.prepare(
      "UPDATE notification_presets SET label = $label, emoji = $emoji, color = $color WHERE id = $id",
    ),
    deleteNotificationPreset: database.prepare(
      "DELETE FROM notification_presets WHERE id = $id",
    ),

    upsertCell:
      database.prepare(`INSERT INTO cells (song_id, column_id, value) VALUES ($song_id, $column_id, $value)
    ON CONFLICT(song_id, column_id) DO UPDATE SET value = $value`),
  };
}

// --- Show management ---

export function listShows(): string[] {
  return readdirSync(showsDir)
    .filter((f) => f.endsWith(".db"))
    .map((f) => basename(f, ".db"))
    .sort();
}

export function selectShow(name: string): void {
  if (db) {
    db.close();
    db = null;
    stmts = null;
  }
  const dbPath = join(showsDir, `${name}.db`);
  db = new Database(dbPath);
  initializeSchema(db);
  stmts = prepareStatements(db);
  currentShowName = name;
}

export function createShow(name: string): void {
  if (/[/\\]/.test(name) || name.includes("..")) {
    throw new Error("Invalid show name");
  }
  if (!name.trim()) {
    throw new Error("Show name cannot be empty");
  }
  const dbPath = join(showsDir, `${name}.db`);
  if (existsSync(dbPath)) {
    throw new Error(`Show "${name}" already exists`);
  }
  selectShow(name);
}

export function deleteShow(name: string): void {
  if (name === currentShowName) {
    throw new Error("Cannot delete the active show");
  }
  const dbPath = join(showsDir, `${name}.db`);
  if (!existsSync(dbPath)) {
    throw new Error(`Show "${name}" not found`);
  }
  unlinkSync(dbPath);
  for (const ext of ["-wal", "-shm"]) {
    const p = dbPath + ext;
    if (existsSync(p)) unlinkSync(p);
  }
}

export function getCurrentShowName(): string | null {
  return currentShowName;
}

// --- Data access (guarded) ---

export function getFullState() {
  const s = requireStmts();
  return {
    mics: s.allMics.all(),
    stageElements: s.allElements.all(),
    zones: s.allZones.all(),
    columns: s.allColumns.all(),
    songs: s.allSongs.all(),
    cells: s.allCells.all(),
    notificationPresets: s.allNotificationPresets.all(),
  };
}

export function createMic(data: {
  number: number;
  name?: string;
  x?: number;
  y?: number;
}) {
  const s = requireStmts();
  const result = s.insertMic.run({
    $number: data.number,
    $name: data.name ?? "",
    $x: data.x ?? 400,
    $y: data.y ?? 300,
  });
  return {
    id: result.lastInsertRowid,
    number: data.number,
    name: data.name ?? "",
    x: data.x ?? 400,
    y: data.y ?? 300,
  };
}

export function updateMic(
  id: number,
  data: { number?: number; name?: string; x?: number; y?: number },
) {
  const database = requireDb();
  const s = requireStmts();
  const existing = database
    .prepare("SELECT * FROM mics WHERE id = ?")
    .get(id) as any;
  if (!existing) throw new Error(`Mic ${id} not found`);
  s.updateMic.run({
    $id: id,
    $number: data.number ?? existing.number,
    $name: data.name ?? existing.name,
    $x: data.x ?? existing.x,
    $y: data.y ?? existing.y,
  });
  return {
    id,
    number: data.number ?? existing.number,
    name: data.name ?? existing.name,
    x: data.x ?? existing.x,
    y: data.y ?? existing.y,
  };
}

export function deleteMic(id: number) {
  requireStmts().deleteMic.run({ $id: id });
}

export function createElement(data: {
  kind: string;
  label?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}) {
  const s = requireStmts();
  const result = s.insertElement.run({
    $kind: data.kind,
    $label: data.label ?? "",
    $x: data.x ?? 400,
    $y: data.y ?? 300,
    $width: data.width ?? (data.kind === "object" ? 200 : 0),
    $height: data.height ?? (data.kind === "object" ? 120 : 0),
    $rotation: data.rotation ?? 0,
  });
  return {
    id: result.lastInsertRowid,
    kind: data.kind,
    label: data.label ?? "",
    x: data.x ?? 400,
    y: data.y ?? 300,
    width: data.width ?? (data.kind === "object" ? 200 : 0),
    height: data.height ?? (data.kind === "object" ? 120 : 0),
    rotation: data.rotation ?? 0,
  };
}

export function updateElement(
  id: number,
  data: {
    kind?: string;
    label?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
  },
) {
  const database = requireDb();
  const s = requireStmts();
  const existing = database
    .prepare("SELECT * FROM stage_elements WHERE id = ?")
    .get(id) as any;
  if (!existing) throw new Error(`Element ${id} not found`);
  s.updateElement.run({
    $id: id,
    $kind: data.kind ?? existing.kind,
    $label: data.label ?? existing.label,
    $x: data.x ?? existing.x,
    $y: data.y ?? existing.y,
    $width: data.width ?? existing.width,
    $height: data.height ?? existing.height,
    $rotation: data.rotation ?? existing.rotation,
  });
  return {
    id,
    kind: data.kind ?? existing.kind,
    label: data.label ?? existing.label,
    x: data.x ?? existing.x,
    y: data.y ?? existing.y,
    width: data.width ?? existing.width,
    height: data.height ?? existing.height,
    rotation: data.rotation ?? existing.rotation,
  };
}

export function deleteElement(id: number) {
  requireStmts().deleteElement.run({ $id: id });
}

export function createZone(data: {
  name?: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  const s = requireStmts();
  const result = s.insertZone.run({
    $name: data.name ?? "",
    $color: data.color ?? "#6B9FFF",
    $x: data.x ?? 200,
    $y: data.y ?? 200,
    $width: data.width ?? 200,
    $height: data.height ?? 150,
  });
  return {
    id: result.lastInsertRowid,
    name: data.name ?? "",
    color: data.color ?? "#6B9FFF",
    x: data.x ?? 200,
    y: data.y ?? 200,
    width: data.width ?? 200,
    height: data.height ?? 150,
  };
}

export function updateZone(
  id: number,
  data: {
    name?: string;
    color?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  },
) {
  const database = requireDb();
  const s = requireStmts();
  const existing = database
    .prepare("SELECT * FROM zones WHERE id = ?")
    .get(id) as any;
  if (!existing) throw new Error(`Zone ${id} not found`);
  s.updateZone.run({
    $id: id,
    $name: data.name ?? existing.name,
    $color: data.color ?? existing.color,
    $x: data.x ?? existing.x,
    $y: data.y ?? existing.y,
    $width: data.width ?? existing.width,
    $height: data.height ?? existing.height,
  });
  return {
    id,
    name: data.name ?? existing.name,
    color: data.color ?? existing.color,
    x: data.x ?? existing.x,
    y: data.y ?? existing.y,
    width: data.width ?? existing.width,
    height: data.height ?? existing.height,
  };
}

export function deleteZone(id: number) {
  requireStmts().deleteZone.run({ $id: id });
}

export function createColumn(data: {
  key: string;
  label: string;
  type: "mic" | "text";
}) {
  const s = requireStmts();
  const maxOrder = s.maxColumnOrder.get() as { max_order: number };
  const sortOrder = maxOrder.max_order + 1;
  const result = s.insertColumn.run({
    $key: data.key,
    $label: data.label,
    $type: data.type,
    $sort_order: sortOrder,
  });
  return {
    id: result.lastInsertRowid,
    key: data.key,
    label: data.label,
    type: data.type,
    sort_order: sortOrder,
    is_default: 0,
  };
}

export function updateColumn(
  id: number,
  data: { label?: string; type?: "mic" | "text" },
) {
  const database = requireDb();
  const s = requireStmts();
  const existing = database
    .prepare("SELECT * FROM columns WHERE id = ?")
    .get(id) as any;
  if (!existing) throw new Error(`Column ${id} not found`);
  s.updateColumn.run({
    $id: id,
    $label: data.label ?? existing.label,
    $type: data.type ?? existing.type,
  });
  return {
    ...existing,
    label: data.label ?? existing.label,
    type: data.type ?? existing.type,
  };
}

export function deleteColumn(id: number) {
  const result = requireStmts().deleteColumn.run({ $id: id });
  if (result.changes === 0) throw new Error("Cannot delete default column");
}

export function reorderColumns(ids: number[]) {
  const database = requireDb();
  const s = requireStmts();
  database.transaction(() => {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!;
      s.updateColumnOrder.run({ $id: id, $sort_order: i });
    }
  })();
}

export function createSong(data: { title?: string; artist?: string }) {
  const s = requireStmts();
  const maxOrder = s.maxSongOrder.get() as { max_order: number };
  const sortOrder = maxOrder.max_order + 1;
  const result = s.insertSong.run({
    $title: data.title ?? "",
    $artist: data.artist ?? "",
    $sort_order: sortOrder,
  });
  return {
    id: result.lastInsertRowid,
    title: data.title ?? "",
    artist: data.artist ?? "",
    sort_order: sortOrder,
  };
}

export function updateSong(
  id: number,
  data: { title?: string; artist?: string },
) {
  const database = requireDb();
  const s = requireStmts();
  const existing = database
    .prepare("SELECT * FROM songs WHERE id = ?")
    .get(id) as any;
  if (!existing) throw new Error(`Song ${id} not found`);
  s.updateSong.run({
    $id: id,
    $title: data.title ?? existing.title,
    $artist: data.artist ?? existing.artist,
  });
  return {
    ...existing,
    title: data.title ?? existing.title,
    artist: data.artist ?? existing.artist,
  };
}

export function deleteSong(id: number) {
  requireStmts().deleteSong.run({ $id: id });
}

export function reorderSongs(ids: number[]) {
  const database = requireDb();
  const s = requireStmts();
  database.transaction(() => {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!;
      s.updateSongOrder.run({ $id: id, $sort_order: i });
    }
  })();
}

export function upsertCell(songId: number, columnId: number, value: string) {
  requireStmts().upsertCell.run({
    $song_id: songId,
    $column_id: columnId,
    $value: value,
  });
  return { song_id: songId, column_id: columnId, value };
}

export interface NotificationPreset {
  id: number;
  label: string;
  emoji: string;
  color: string;
  sort_order: number;
}

export function createNotificationPreset(data: {
  label: string;
  emoji: string;
  color: string;
}): NotificationPreset {
  const s = requireStmts();
  const maxOrder = s.maxNotificationPresetOrder.get() as { max_order: number };
  const sortOrder = maxOrder.max_order + 1;
  const result = s.insertNotificationPreset.run({
    $label: data.label,
    $emoji: data.emoji,
    $color: data.color,
    $sort_order: sortOrder,
  });
  return {
    id: Number(result.lastInsertRowid),
    label: data.label,
    emoji: data.emoji,
    color: data.color,
    sort_order: sortOrder,
  };
}

export function updateNotificationPreset(
  id: number,
  data: { label?: string; emoji?: string; color?: string },
): NotificationPreset {
  const s = requireStmts();
  const existing = s.getNotificationPresetById.get(id) as
    | NotificationPreset
    | undefined;
  if (!existing) throw new Error(`Notification preset ${id} not found`);
  const updated = {
    label: data.label ?? existing.label,
    emoji: data.emoji ?? existing.emoji,
    color: data.color ?? existing.color,
  };
  s.updateNotificationPreset.run({
    $id: id,
    $label: updated.label,
    $emoji: updated.emoji,
    $color: updated.color,
  });
  return { ...existing, ...updated };
}

export function deleteNotificationPreset(id: number) {
  const result = requireStmts().deleteNotificationPreset.run({ $id: id });
  if (result.changes === 0)
    throw new Error(`Notification preset ${id} not found`);
}

export function getNotificationPreset(id: number): NotificationPreset | null {
  return (
    (requireStmts().getNotificationPresetById.get(
      id,
    ) as NotificationPreset | null) ?? null
  );
}
