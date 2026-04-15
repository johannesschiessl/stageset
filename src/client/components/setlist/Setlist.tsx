import { Badge } from "@/client/components/ui/Badge";
import { Button } from "@/client/components/ui/Button";
import { Checkbox } from "@/client/components/ui/Checkbox";
import { Input } from "@/client/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/Table";
import { Textarea } from "@/client/components/ui/Textarea";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Microphone, Song } from "@/types";

function micLabel(mic: Microphone) {
  return mic.name ? `${mic.number} – ${mic.name}` : String(mic.number);
}

interface SetlistProps {
  songs: Song[];
  microphones: Microphone[];
  onUpdateSong: (id: string, updates: Partial<Song>) => void;
  onAddSong: () => void;
  onRemoveSong: (id: string) => void;
  onMoveSong: (id: string, direction: "up" | "down") => void;
  onToggleMicrophone: (
    songId: string,
    micId: string,
    type: "microphones" | "monitor",
  ) => void;
}

export function Setlist({
  songs,
  microphones,
  onUpdateSong,
  onAddSong,
  onRemoveSong,
  onMoveSong,
  onToggleMicrophone,
}: SetlistProps) {
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: "mics" | "monitor" | null;
  }>({});

  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      let clickedInDropdown = false;

      for (const ref of Object.values(dropdownRefs.current)) {
        if (ref && ref.contains(target)) {
          clickedInDropdown = true;
          break;
        }
      }

      if (!clickedInDropdown) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (songId: string, type: "mics" | "monitor") => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [songId]: prev[songId] === type ? null : type,
    }));
  };

  return (
    <div className="mb-10">
      <div className="mb-2 flex items-center justify-between px-2">
        <Badge variant="outline">{songs.length} SONGS</Badge>
        <Button onClick={onAddSong} className="w-fit">
          ADD SONG
        </Button>
      </div>

      <div className="[&_[data-slot=table-container]]:overflow-visible">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase font-black w-12"></TableHead>
              <TableHead className="uppercase font-black">Song</TableHead>
              <TableHead className="uppercase font-black">
                Microphones
              </TableHead>
              <TableHead className="uppercase font-black">Monitor</TableHead>
              <TableHead className="uppercase font-black">Notes</TableHead>
              <TableHead className="uppercase font-black w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.map((song, index) => (
              <TableRow key={song.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onMoveSong(song.id, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onMoveSong(song.id, "down")}
                      disabled={index === songs.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>

                <TableCell className="w-64">
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Song title"
                      value={song.title}
                      onChange={(e) =>
                        onUpdateSong(song.id, { title: e.target.value })
                      }
                      className="border-transparent bg-transparent dark:bg-transparent transition-colors focus-visible:border-input focus-visible:bg-input/30 text-sm font-semibold"
                    />
                    <Input
                      placeholder="Artist"
                      value={song.artist}
                      onChange={(e) =>
                        onUpdateSong(song.id, { artist: e.target.value })
                      }
                      className="border-transparent bg-transparent dark:bg-transparent transition-colors focus-visible:border-input focus-visible:bg-input/30 text-muted-foreground"
                    />
                  </div>
                </TableCell>

                <TableCell>
                  <div
                    className="relative"
                    ref={(el) => {
                      if (el) dropdownRefs.current[`${song.id}-mics`] = el;
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs flex items-center gap-1"
                      onClick={() => toggleDropdown(song.id, "mics")}
                    >
                      <div className="flex flex-wrap gap-1 max-w-48">
                        {song.microphones.length > 0 ? (
                          song.microphones.map((micId) => (
                            <Badge
                              key={micId}
                              variant="default"
                              className="text-[0.65rem]"
                            >
                              {(() => {
                                const mic = microphones.find(
                                  (m) => m.id === micId,
                                );
                                return mic ? micLabel(mic) : micId;
                              })()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">
                            Select mics
                          </span>
                        )}
                      </div>
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>

                    {openDropdowns[song.id] === "mics" && (
                      <div className="absolute top-full left-0 mt-1 bg-background border border-input rounded-none p-2 z-50 min-w-48 shadow-lg">
                        {microphones.map((mic) => (
                          <label
                            key={mic.id}
                            className="flex items-center gap-2 p-1.5 text-xs cursor-pointer hover:bg-muted rounded-none"
                          >
                            <Checkbox
                              checked={song.microphones.includes(mic.id)}
                              onCheckedChange={() =>
                                onToggleMicrophone(
                                  song.id,
                                  mic.id,
                                  "microphones",
                                )
                              }
                            />
                            {micLabel(mic)}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div
                    className="relative"
                    ref={(el) => {
                      if (el) dropdownRefs.current[`${song.id}-monitor`] = el;
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs flex items-center gap-1"
                      onClick={() => toggleDropdown(song.id, "monitor")}
                    >
                      <div className="flex flex-wrap gap-1 max-w-48">
                        {song.monitor.length > 0 ? (
                          song.monitor.map((micId) => (
                            <Badge
                              key={micId}
                              variant="secondary"
                              className="text-[0.65rem]"
                            >
                              {(() => {
                                const mic = microphones.find(
                                  (m) => m.id === micId,
                                );
                                return mic ? micLabel(mic) : micId;
                              })()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">
                            Select monitor
                          </span>
                        )}
                      </div>
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>

                    {openDropdowns[song.id] === "monitor" && (
                      <div className="absolute top-full left-0 mt-1 bg-background border border-input rounded-none p-2 z-50 min-w-48 shadow-lg">
                        {microphones.map((mic) => (
                          <label
                            key={mic.id}
                            className="flex items-center gap-2 p-1.5 text-xs cursor-pointer hover:bg-muted rounded-none"
                          >
                            <Checkbox
                              checked={song.monitor.includes(mic.id)}
                              onCheckedChange={() =>
                                onToggleMicrophone(song.id, mic.id, "monitor")
                              }
                            />
                            {micLabel(mic)}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="min-w-48">
                  <Textarea
                    placeholder="Notes"
                    value={song.notes}
                    onChange={(e) =>
                      onUpdateSong(song.id, { notes: e.target.value })
                    }
                    className="border-transparent bg-transparent dark:bg-transparent transition-colors h-16 resize-none focus-visible:border-input focus-visible:bg-input/30"
                  />
                </TableCell>

                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => onRemoveSong(song.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
