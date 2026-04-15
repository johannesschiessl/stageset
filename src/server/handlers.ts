import {
  getMicrophones,
  addMicrophone,
  updateMicrophone,
  removeMicrophone,
  getSongs,
  addSong,
  updateSong,
  removeSong,
  moveSong,
} from "./db";
import type { Microphone, Song, BroadcastMessage } from "../types";

export function handleQuery(
  queryKey: string,
): { data: unknown } | { error: string } {
  try {
    if (queryKey === "microphones") {
      return { data: getMicrophones() };
    }
    if (queryKey === "songs") {
      return { data: getSongs() };
    }
    return { error: `Unknown query: ${queryKey}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export function handleMutation(
  mutationKey: string,
  params: unknown,
): { data: unknown; broadcasts?: BroadcastMessage[] } | { error: string } {
  try {
    const p = (params ?? {}) as any;

    if (mutationKey === "addMicrophone") {
      const newId =
        Math.max(...getMicrophones().map((m) => parseInt(m.id)), 0) + 1;
      const usedNumbers = new Set(getMicrophones().map((m) => m.number));
      let nextNumber = 1;
      while (usedNumbers.has(nextNumber)) nextNumber++;

      const mic = addMicrophone({
        id: newId.toString(),
        number: nextNumber,
        name: p?.name || "",
      });

      return {
        data: mic,
        broadcasts: [
          { type: "broadcast", key: "microphones", data: getMicrophones() },
        ],
      };
    }

    if (mutationKey === "updateMicrophone") {
      const mic = updateMicrophone(p.id, p.updates);
      return {
        data: mic,
        broadcasts: [
          { type: "broadcast", key: "microphones", data: getMicrophones() },
        ],
      };
    }

    if (mutationKey === "removeMicrophone") {
      removeMicrophone(p.id);
      return {
        data: null,
        broadcasts: [
          { type: "broadcast", key: "microphones", data: getMicrophones() },
          { type: "broadcast", key: "songs", data: getSongs() },
        ],
      };
    }

    if (mutationKey === "addSong") {
      const song = addSong({
        title: p.title || "",
        artist: p.artist || "",
        microphones: [],
        monitor: [],
        notes: "",
      });
      return {
        data: song,
        broadcasts: [{ type: "broadcast", key: "songs", data: getSongs() }],
      };
    }

    if (mutationKey === "updateSong") {
      const song = updateSong(p.id, p.updates);
      return {
        data: song,
        broadcasts: [{ type: "broadcast", key: "songs", data: getSongs() }],
      };
    }

    if (mutationKey === "removeSong") {
      removeSong(p.id);
      return {
        data: null,
        broadcasts: [{ type: "broadcast", key: "songs", data: getSongs() }],
      };
    }

    if (mutationKey === "moveSong") {
      const result = moveSong(p.id, p.direction);
      if ("error" in result) {
        return { error: result.error };
      }
      return {
        data: null,
        broadcasts: [{ type: "broadcast", key: "songs", data: getSongs() }],
      };
    }

    if (mutationKey === "toggleMicrophone") {
      const song = getSongs().find((s) => s.id === p.songId);
      if (!song) return { error: `Song ${p.songId} not found` };

      const type: "microphones" | "monitor" = p.type;
      const currentMics = song[type];
      const updated = currentMics.includes(p.micId)
        ? currentMics.filter((m: string) => m !== p.micId)
        : [...currentMics, p.micId];

      const updatedSong = updateSong(p.songId, { [type]: updated });
      return {
        data: updatedSong,
        broadcasts: [{ type: "broadcast", key: "songs", data: getSongs() }],
      };
    }

    return { error: `Unknown mutation: ${mutationKey}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
