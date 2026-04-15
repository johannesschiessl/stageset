import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Microphone, Song } from "../types";

const dbPath = `${Bun.env.HOME}/stageset/stageset.db`;
mkdirSync(dirname(dbPath), { recursive: true });
export const db = new Database(dbPath);

export function initializeDatabase() {
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS microphones (
      id TEXT PRIMARY KEY,
      number INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      microphones TEXT NOT NULL,
      monitor TEXT NOT NULL,
      notes TEXT NOT NULL,
      position INTEGER NOT NULL
    );
  `);
}

// Microphone operations
export function getMicrophones(): Microphone[] {
  const results = db
    .query("SELECT * FROM microphones ORDER BY number ASC")
    .all() as Microphone[];
  return results;
}

export function addMicrophone(mic: Microphone): Microphone {
  db.query("INSERT INTO microphones (id, number, name) VALUES (?, ?, ?)").run(
    mic.id,
    mic.number,
    mic.name,
  );
  return mic;
}

export function updateMicrophone(
  id: string,
  updates: Partial<Microphone>,
): Microphone {
  const current = db
    .query("SELECT * FROM microphones WHERE id = ?")
    .get(id) as Microphone | null;

  if (!current) throw new Error(`Microphone ${id} not found`);

  const updated = { ...current, ...updates };

  if (updates.number !== undefined) {
    db.query("UPDATE microphones SET number = ? WHERE id = ?").run(
      updates.number,
      id,
    );
  }
  if (updates.name !== undefined) {
    db.query("UPDATE microphones SET name = ? WHERE id = ?").run(
      updates.name,
      id,
    );
  }

  return updated;
}

export function removeMicrophone(id: string): void {
  db.query("DELETE FROM microphones WHERE id = ?").run(id);
  // Remove from all songs (microphones/monitor are stored as JSON strings in SQLite)
  const songs = db.query("SELECT * FROM songs").all() as any[];
  for (const song of songs) {
    const mics = (JSON.parse(song.microphones) as string[]).filter(
      (m) => m !== id,
    );
    const monitor = (JSON.parse(song.monitor) as string[]).filter(
      (m) => m !== id,
    );
    db.query("UPDATE songs SET microphones = ?, monitor = ? WHERE id = ?").run(
      JSON.stringify(mics),
      JSON.stringify(monitor),
      song.id,
    );
  }
}

// Song operations
export function getSongs(): Song[] {
  const results = db
    .query("SELECT * FROM songs ORDER BY position ASC")
    .all() as any[];
  return results.map((row) => ({
    ...row,
    microphones: JSON.parse(row.microphones),
    monitor: JSON.parse(row.monitor),
  }));
}

export function addSong(song: Omit<Song, "id">): Song {
  const id = Math.random().toString(36).slice(2);
  const maxPosition =
    (db.query("SELECT MAX(position) as max FROM songs").get() as any)?.max ??
    -1;
  const position = maxPosition + 1;

  db.query(
    "INSERT INTO songs (id, title, artist, microphones, monitor, notes, position) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    song.title,
    song.artist,
    JSON.stringify(song.microphones),
    JSON.stringify(song.monitor),
    song.notes,
    position,
  );

  return { ...song, id };
}

export function updateSong(id: string, updates: Partial<Song>): Song {
  const current = db.query("SELECT * FROM songs WHERE id = ?").get(id) as
    | any
    | null;

  if (!current) throw new Error(`Song ${id} not found`);

  const updated = {
    ...current,
    microphones: current.microphones ? JSON.parse(current.microphones) : [],
    monitor: current.monitor ? JSON.parse(current.monitor) : [],
    ...updates,
  } as Song;

  const updateQuery = [];
  const params = [];

  if (updates.title !== undefined) {
    updateQuery.push("title = ?");
    params.push(updates.title);
  }
  if (updates.artist !== undefined) {
    updateQuery.push("artist = ?");
    params.push(updates.artist);
  }
  if (updates.microphones !== undefined) {
    updateQuery.push("microphones = ?");
    params.push(JSON.stringify(updates.microphones));
  }
  if (updates.monitor !== undefined) {
    updateQuery.push("monitor = ?");
    params.push(JSON.stringify(updates.monitor));
  }
  if (updates.notes !== undefined) {
    updateQuery.push("notes = ?");
    params.push(updates.notes);
  }

  if (updateQuery.length > 0) {
    params.push(id);
    db.query(`UPDATE songs SET ${updateQuery.join(", ")} WHERE id = ?`).run(
      ...params,
    );
  }

  return updated;
}

export function removeSong(id: string): void {
  db.query("DELETE FROM songs WHERE id = ?").run(id);
}

export function moveSong(
  id: string,
  direction: "up" | "down",
): { songs: Song[]; error?: string } {
  const songs = getSongs();
  const index = songs.findIndex((s) => s.id === id);

  if (
    (direction === "up" && index === 0) ||
    (direction === "down" && index === songs.length - 1)
  ) {
    return { songs, error: "Cannot move song" };
  }

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  const a = songs[index];
  const b = songs[swapIndex];

  db.query("UPDATE songs SET position = ? WHERE id = ?").run(swapIndex, a.id);
  db.query("UPDATE songs SET position = ? WHERE id = ?").run(index, b.id);

  return { songs: getSongs() };
}
