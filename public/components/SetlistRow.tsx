import React, { useState, useRef, useCallback } from "react";
import { usePlan } from "../App";
import type { Song, Column } from "../types";
import { MicSelector } from "./MicSelector";

interface Props {
  song: Song;
  columns: Column[];
  index: number;
  totalSongs: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export function SetlistRow({ song, columns, index, totalSongs, onMoveUp, onMoveDown, onDelete }: Props) {
  const { state, send } = usePlan();
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Sync title/artist from server
  if (song.title !== title && document.activeElement?.getAttribute("data-song-title") !== String(song.id)) {
    if (title !== song.title) setTitle(song.title);
  }
  if (song.artist !== artist && document.activeElement?.getAttribute("data-song-artist") !== String(song.id)) {
    if (artist !== song.artist) setArtist(song.artist);
  }

  const handleTitleBlur = () => {
    if (title !== song.title) {
      send({ type: "song:update", id: song.id, data: { title } });
    }
  };

  const handleArtistBlur = () => {
    if (artist !== song.artist) {
      send({ type: "song:update", id: song.id, data: { artist } });
    }
  };

  const getCellValue = (columnId: number): string => {
    const cell = state.cells.get(`${song.id}:${columnId}`);
    return cell?.value ?? "";
  };

  const handleTextCellChange = useCallback((columnId: number, value: string) => {
    const key = `${song.id}:${columnId}`;
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(() => {
      send({ type: "cell:update", songId: song.id, columnId, value });
    }, 500);
  }, [send, song.id]);

  const handleMicCellChange = useCallback((columnId: number, micIds: number[]) => {
    send({ type: "cell:update", songId: song.id, columnId, value: JSON.stringify(micIds) });
  }, [send, song.id]);

  const parseMicIds = (value: string): number[] => {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  return (
    <tr>
      <td className="song-cell">
        <input
          className="song-title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Song title"
          data-song-title={song.id}
        />
        <input
          className="song-artist-input"
          value={artist}
          onChange={e => setArtist(e.target.value)}
          onBlur={handleArtistBlur}
          placeholder="Artist"
          data-song-artist={song.id}
        />
      </td>
      {columns.map(col => (
        <td key={col.id}>
          {col.type === "mic" ? (
            <MicSelector
              selectedMicIds={parseMicIds(getCellValue(col.id))}
              onChange={ids => handleMicCellChange(col.id, ids)}
            />
          ) : (
            <TextCell
              value={getCellValue(col.id)}
              onChange={value => handleTextCellChange(col.id, value)}
            />
          )}
        </td>
      ))}
      <td>
        <div className="row-controls">
          <button className="row-btn" onClick={onMoveUp} disabled={index === 0} title="Move up">
            {"\u25B2"}
          </button>
          <button className="row-btn" onClick={onMoveDown} disabled={index === totalSongs - 1} title="Move down">
            {"\u25BC"}
          </button>
          <button className="row-btn danger" onClick={onDelete} title="Delete song">
            {"\u2715"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function TextCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  // Sync from server when not focused
  if (value !== local && ref.current !== document.activeElement) {
    if (local !== value) setLocal(value);
  }

  return (
    <input
      ref={ref}
      className="cell-text-input"
      value={local}
      onChange={e => {
        setLocal(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={() => {
        if (local !== value) onChange(local);
      }}
    />
  );
}
