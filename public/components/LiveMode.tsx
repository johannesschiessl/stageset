import React, { useState, useEffect, useCallback } from "react";
import { usePlan } from "../App";
import type { Mic } from "../types";

interface Props {
  onExit: () => void;
  onToggleNotifications: () => void;
  notificationsOpen: boolean;
}

export function LiveMode({
  onExit,
  onToggleNotifications,
  notificationsOpen,
}: Props) {
  const { state } = usePlan();
  const [currentIndex, setCurrentIndex] = useState(0);

  const songs = state.songs;
  const columns = state.columns;
  const totalSongs = songs.length;

  const goNext = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, totalSongs - 1));
  }, [totalSongs]);

  const goPrev = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onToggleNotifications();
        return;
      }

      if (notificationsOpen) {
        return;
      }

      if (e.key === "Escape") {
        onExit();
        return;
      }
      if (
        e.key === " " ||
        e.key === "ArrowRight" ||
        e.key === "ArrowDown"
      ) {
        e.preventDefault();
        goNext();
      }
      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, notificationsOpen, onExit, onToggleNotifications]);

  // Keep index in bounds when songs change
  useEffect(() => {
    if (currentIndex >= totalSongs && totalSongs > 0) {
      setCurrentIndex(totalSongs - 1);
    }
  }, [totalSongs, currentIndex]);

  const mics = Array.from(state.mics.values())
    .filter((m): m is Mic & { id: number } => typeof m.id === "number")
    .sort((a, b) => a.number - b.number);

  const getMicById = (id: number) => mics.find(m => m.id === id);

  const getCellValue = (songId: number | string, columnId: number): string => {
    const cell = state.cells.get(`${songId}:${columnId}`);
    return cell?.value ?? "";
  };

  const parseMicIds = (value: string): number[] => {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  if (totalSongs === 0) {
    return (
      <div className="live-mode">
        <div className="live-topbar">
          <button className="live-exit-btn" onClick={onExit}>EXIT LIVE</button>
          <div className="live-counter">NO SONGS</div>
          <button
            className={`live-notify-btn ${notificationsOpen ? "active" : ""}`}
            onClick={onToggleNotifications}
          >
            Notify
          </button>
        </div>
        <div className="live-empty">No songs in setlist</div>
      </div>
    );
  }

  const song = songs[currentIndex]!;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSongs - 1;

  const prevSong = !isFirst ? songs[currentIndex - 1] : null;
  const nextSong = !isLast ? songs[currentIndex + 1] : null;

  return (
    <div className="live-mode" tabIndex={-1}>
      {/* Top bar */}
      <div className="live-topbar">
        <button className="live-exit-btn" onClick={onExit}>ESC</button>
        <div className="live-counter">
          {currentIndex + 1} / {totalSongs}
        </div>
        <div className="live-progress-bar">
          <div
            className="live-progress-fill"
            style={{ width: `${((currentIndex + 1) / totalSongs) * 100}%` }}
          />
        </div>
        <button
          className={`live-notify-btn ${notificationsOpen ? "active" : ""}`}
          onClick={onToggleNotifications}
        >
          Notify
        </button>
      </div>

      {/* Main content area with side nav */}
      <div className="live-body">
        {/* Left nav */}
        <button
          className={`live-nav-btn live-nav-prev ${isFirst ? "disabled" : ""}`}
          onClick={goPrev}
          disabled={isFirst}
        >
          <span className="live-nav-arrow">{"\u25C0"}</span>
          {prevSong && (
            <span className="live-nav-label">{prevSong.title || "Untitled"}</span>
          )}
        </button>

        {/* Center: Current song */}
        <div className="live-center">
          <div className="live-song-number">#{currentIndex + 1}</div>
          <div className="live-song-title">{song.title || "Untitled"}</div>
          {song.artist && (
            <div className="live-song-artist">{song.artist}</div>
          )}

          {/* Column boxes */}
          <div className="live-columns">
            {columns.map(col => {
              const value = getCellValue(song.id, col.id);

              if (col.type === "mic") {
                const micIds = parseMicIds(value);
                const selectedMics = micIds
                  .map(id => getMicById(id))
                  .filter(Boolean) as (Mic & { id: number })[];

                return (
                  <div key={col.id} className="live-column-box live-column-mic">
                    <div className="live-column-label">{col.label}</div>
                    <div className="live-mic-list">
                      {selectedMics.length === 0 ? (
                        <div className="live-mic-empty">{"\u2014"}</div>
                      ) : (
                        selectedMics.map(mic => (
                          <div key={mic.id} className="live-mic-item">
                            <span className="live-mic-badge">{mic.number}</span>
                            <span className="live-mic-name">{mic.name || `Mic ${mic.number}`}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={col.id} className="live-column-box live-column-text">
                  <div className="live-column-label">{col.label}</div>
                  <div className="live-column-value">
                    {value || <span className="live-text-empty">{"\u2014"}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right nav */}
        <button
          className={`live-nav-btn live-nav-next ${isLast ? "disabled" : ""}`}
          onClick={goNext}
          disabled={isLast}
        >
          {nextSong && (
            <span className="live-nav-label">{nextSong.title || "Untitled"}</span>
          )}
          <span className="live-nav-arrow">{"\u25B6"}</span>
        </button>
      </div>
    </div>
  );
}
