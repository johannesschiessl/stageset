import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const dbDir = join(homedir(), ".stageset");
mkdirSync(dbDir, { recursive: true });

const db = new Database(join(dbDir, "stageset.db"));

db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");
db.run("PRAGMA synchronous = NORMAL");

// Schema
db.run(`CREATE TABLE IF NOT EXISTS mics (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  number  INTEGER NOT NULL UNIQUE,
  name    TEXT NOT NULL DEFAULT '',
  x       REAL NOT NULL DEFAULT 400,
  y       REAL NOT NULL DEFAULT 300
)`);

db.run(`CREATE TABLE IF NOT EXISTS stage_elements (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  kind     TEXT NOT NULL,
  label    TEXT NOT NULL DEFAULT '',
  x        REAL NOT NULL DEFAULT 400,
  y        REAL NOT NULL DEFAULT 300,
  rotation REAL NOT NULL DEFAULT 0
)`);

db.run(`CREATE TABLE IF NOT EXISTS columns (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  type       TEXT NOT NULL CHECK(type IN ('mic','text')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0
)`);

db.run(`CREATE TABLE IF NOT EXISTS songs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL DEFAULT '',
  artist     TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
)`);

db.run(`CREATE TABLE IF NOT EXISTS cells (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id   INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  column_id INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  value     TEXT NOT NULL DEFAULT '',
  UNIQUE(song_id, column_id)
)`);

// Seed default columns if empty
const columnCount = db.query("SELECT COUNT(*) as count FROM columns").get() as { count: number };
if (columnCount.count === 0) {
  const insertCol = db.prepare("INSERT INTO columns (key, label, type, sort_order, is_default) VALUES (?, ?, ?, ?, 1)");
  insertCol.run("microphones", "Microphones", "mic", 0);
  insertCol.run("monitor", "Monitor", "mic", 1);
  insertCol.run("notes", "Notes", "text", 2);
}

// Prepared statements
const stmts = {
  allMics: db.prepare("SELECT * FROM mics ORDER BY number"),
  allElements: db.prepare("SELECT * FROM stage_elements ORDER BY id"),
  allColumns: db.prepare("SELECT * FROM columns ORDER BY sort_order, id"),
  allSongs: db.prepare("SELECT * FROM songs ORDER BY sort_order, id"),
  allCells: db.prepare("SELECT * FROM cells"),

  insertMic: db.prepare("INSERT INTO mics (number, name, x, y) VALUES ($number, $name, $x, $y)"),
  updateMic: db.prepare("UPDATE mics SET number = $number, name = $name, x = $x, y = $y WHERE id = $id"),
  deleteMic: db.prepare("DELETE FROM mics WHERE id = $id"),

  insertElement: db.prepare("INSERT INTO stage_elements (kind, label, x, y, rotation) VALUES ($kind, $label, $x, $y, $rotation)"),
  updateElement: db.prepare("UPDATE stage_elements SET kind = $kind, label = $label, x = $x, y = $y, rotation = $rotation WHERE id = $id"),
  deleteElement: db.prepare("DELETE FROM stage_elements WHERE id = $id"),

  insertColumn: db.prepare("INSERT INTO columns (key, label, type, sort_order, is_default) VALUES ($key, $label, $type, $sort_order, 0)"),
  updateColumn: db.prepare("UPDATE columns SET label = $label, type = $type WHERE id = $id"),
  deleteColumn: db.prepare("DELETE FROM columns WHERE id = $id AND is_default = 0"),
  updateColumnOrder: db.prepare("UPDATE columns SET sort_order = $sort_order WHERE id = $id"),

  insertSong: db.prepare("INSERT INTO songs (title, artist, sort_order) VALUES ($title, $artist, $sort_order)"),
  updateSong: db.prepare("UPDATE songs SET title = $title, artist = $artist WHERE id = $id"),
  deleteSong: db.prepare("DELETE FROM songs WHERE id = $id"),
  updateSongOrder: db.prepare("UPDATE songs SET sort_order = $sort_order WHERE id = $id"),
  maxSongOrder: db.prepare("SELECT COALESCE(MAX(sort_order), -1) as max_order FROM songs"),
  maxColumnOrder: db.prepare("SELECT COALESCE(MAX(sort_order), -1) as max_order FROM columns"),

  upsertCell: db.prepare(`INSERT INTO cells (song_id, column_id, value) VALUES ($song_id, $column_id, $value)
    ON CONFLICT(song_id, column_id) DO UPDATE SET value = $value`),
};

export function getFullState() {
  return {
    mics: stmts.allMics.all(),
    stageElements: stmts.allElements.all(),
    columns: stmts.allColumns.all(),
    songs: stmts.allSongs.all(),
    cells: stmts.allCells.all(),
  };
}

export function createMic(data: { number: number; name?: string; x?: number; y?: number }) {
  const result = stmts.insertMic.run({
    $number: data.number,
    $name: data.name ?? "",
    $x: data.x ?? 400,
    $y: data.y ?? 300,
  });
  return { id: result.lastInsertRowid, number: data.number, name: data.name ?? "", x: data.x ?? 400, y: data.y ?? 300 };
}

export function updateMic(id: number, data: { number?: number; name?: string; x?: number; y?: number }) {
  const existing = db.prepare("SELECT * FROM mics WHERE id = ?").get(id) as any;
  if (!existing) throw new Error(`Mic ${id} not found`);
  stmts.updateMic.run({
    $id: id,
    $number: data.number ?? existing.number,
    $name: data.name ?? existing.name,
    $x: data.x ?? existing.x,
    $y: data.y ?? existing.y,
  });
  return { id, number: data.number ?? existing.number, name: data.name ?? existing.name, x: data.x ?? existing.x, y: data.y ?? existing.y };
}

export function deleteMic(id: number) {
  stmts.deleteMic.run({ $id: id });
}

export function createElement(data: { kind: string; label?: string; x?: number; y?: number; rotation?: number }) {
  const result = stmts.insertElement.run({
    $kind: data.kind,
    $label: data.label ?? "",
    $x: data.x ?? 400,
    $y: data.y ?? 300,
    $rotation: data.rotation ?? 0,
  });
  return { id: result.lastInsertRowid, kind: data.kind, label: data.label ?? "", x: data.x ?? 400, y: data.y ?? 300, rotation: data.rotation ?? 0 };
}

export function updateElement(id: number, data: { kind?: string; label?: string; x?: number; y?: number; rotation?: number }) {
  const existing = db.prepare("SELECT * FROM stage_elements WHERE id = ?").get(id) as any;
  if (!existing) throw new Error(`Element ${id} not found`);
  stmts.updateElement.run({
    $id: id,
    $kind: data.kind ?? existing.kind,
    $label: data.label ?? existing.label,
    $x: data.x ?? existing.x,
    $y: data.y ?? existing.y,
    $rotation: data.rotation ?? existing.rotation,
  });
  return { id, kind: data.kind ?? existing.kind, label: data.label ?? existing.label, x: data.x ?? existing.x, y: data.y ?? existing.y, rotation: data.rotation ?? existing.rotation };
}

export function deleteElement(id: number) {
  stmts.deleteElement.run({ $id: id });
}

export function createColumn(data: { key: string; label: string; type: "mic" | "text" }) {
  const maxOrder = stmts.maxColumnOrder.get() as { max_order: number };
  const sortOrder = maxOrder.max_order + 1;
  const result = stmts.insertColumn.run({
    $key: data.key,
    $label: data.label,
    $type: data.type,
    $sort_order: sortOrder,
  });
  return { id: result.lastInsertRowid, key: data.key, label: data.label, type: data.type, sort_order: sortOrder, is_default: 0 };
}

export function updateColumn(id: number, data: { label?: string; type?: "mic" | "text" }) {
  const existing = db.prepare("SELECT * FROM columns WHERE id = ?").get(id) as any;
  if (!existing) throw new Error(`Column ${id} not found`);
  stmts.updateColumn.run({
    $id: id,
    $label: data.label ?? existing.label,
    $type: data.type ?? existing.type,
  });
  return { ...existing, label: data.label ?? existing.label, type: data.type ?? existing.type };
}

export function deleteColumn(id: number) {
  const result = stmts.deleteColumn.run({ $id: id });
  if (result.changes === 0) throw new Error("Cannot delete default column");
}

export function reorderColumns(ids: number[]) {
  db.transaction(() => {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!;
      stmts.updateColumnOrder.run({ $id: id, $sort_order: i });
    }
  })();
}

export function createSong(data: { title?: string; artist?: string }) {
  const maxOrder = stmts.maxSongOrder.get() as { max_order: number };
  const sortOrder = maxOrder.max_order + 1;
  const result = stmts.insertSong.run({
    $title: data.title ?? "",
    $artist: data.artist ?? "",
    $sort_order: sortOrder,
  });
  return { id: result.lastInsertRowid, title: data.title ?? "", artist: data.artist ?? "", sort_order: sortOrder };
}

export function updateSong(id: number, data: { title?: string; artist?: string }) {
  const existing = db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as any;
  if (!existing) throw new Error(`Song ${id} not found`);
  stmts.updateSong.run({
    $id: id,
    $title: data.title ?? existing.title,
    $artist: data.artist ?? existing.artist,
  });
  return { ...existing, title: data.title ?? existing.title, artist: data.artist ?? existing.artist };
}

export function deleteSong(id: number) {
  stmts.deleteSong.run({ $id: id });
}

export function reorderSongs(ids: number[]) {
  db.transaction(() => {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!;
      stmts.updateSongOrder.run({ $id: id, $sort_order: i });
    }
  })();
}

export function upsertCell(songId: number, columnId: number, value: string) {
  stmts.upsertCell.run({ $song_id: songId, $column_id: columnId, $value: value });
  return { song_id: songId, column_id: columnId, value };
}
