import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/client/components/ui/Tabs";
import { useState } from "react";
import { ConnectionIndicator } from "../components/ConnectionIndicator";
import { Mics } from "../components/mics/Mics";
import { Setlist } from "../components/setlist/Setlist";
import { Button } from "../components/ui/Button";

export interface Microphone {
  id: string;
  number: number;
  name: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  microphones: string[];
  monitor: string[];
  notes: string;
}

const MOCK_MICROPHONES: Microphone[] = [
  { id: "1", number: 1, name: "Mic 1" },
  { id: "2", number: 2, name: "Mic 2" },
  { id: "3", number: 3, name: "Mic 3" },
  { id: "4", number: 4, name: "Mic 4" },
  { id: "5", number: 5, name: "Mic 5" },
];

const MOCK_SONGS: Song[] = [
  {
    id: "1",
    title: "Song One",
    artist: "Artist One",
    microphones: ["1", "2"],
    monitor: ["1"],
    notes: "",
  },
  {
    id: "2",
    title: "Song Two",
    artist: "Artist Two",
    microphones: ["2", "3"],
    monitor: ["2", "3"],
    notes: "",
  },
];

export function Index() {
  const [microphones, setMicrophones] =
    useState<Microphone[]>(MOCK_MICROPHONES);
  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS);

  // Microphone callbacks
  const addMicrophone = () => {
    const newId = Math.max(...microphones.map((m) => parseInt(m.id)), 0) + 1;
    const usedNumbers = new Set(microphones.map((m) => m.number));
    let nextNumber = 1;
    while (usedNumbers.has(nextNumber)) nextNumber++;
    setMicrophones([
      ...microphones,
      {
        id: newId.toString(),
        number: nextNumber,
        name: "",
      },
    ]);
  };

  const updateMicrophone = (id: string, updates: Partial<Microphone>) => {
    setMicrophones(
      microphones.map((mic) => (mic.id === id ? { ...mic, ...updates } : mic)),
    );
  };

  const removeMicrophone = (id: string) => {
    setMicrophones(microphones.filter((mic) => mic.id !== id));
    // Remove this mic from all songs
    setSongs(
      songs.map((song) => ({
        ...song,
        microphones: song.microphones.filter((m) => m !== id),
        monitor: song.monitor.filter((m) => m !== id),
      })),
    );
  };

  // Song callbacks
  const updateSong = (id: string, updates: Partial<Song>) => {
    setSongs(
      songs.map((song) => (song.id === id ? { ...song, ...updates } : song)),
    );
  };

  const addSong = () => {
    const newId = Math.max(...songs.map((s) => parseInt(s.id)), 0) + 1;
    setSongs([
      ...songs,
      {
        id: newId.toString(),
        title: "",
        artist: "",
        microphones: [],
        monitor: [],
        notes: "",
      },
    ]);
  };

  const removeSong = (id: string) => {
    setSongs(songs.filter((song) => song.id !== id));
  };

  const moveSong = (id: string, direction: "up" | "down") => {
    const index = songs.findIndex((s) => s.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === songs.length - 1)
    ) {
      return;
    }

    const newSongs = [...songs];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const a = newSongs[index]!;
    const b = newSongs[swapIndex]!;
    newSongs[index] = b;
    newSongs[swapIndex] = a;
    setSongs(newSongs);
  };

  const toggleMicrophone = (
    songId: string,
    micId: string,
    type: "microphones" | "monitor",
  ) => {
    const song = songs.find((s) => s.id === songId);
    if (!song) return;
    const currentMics = song[type];
    const updated = currentMics.includes(micId)
      ? currentMics.filter((m) => m !== micId)
      : [...currentMics, micId];
    updateSong(songId, { [type]: updated });
  };

  return (
    <Tabs defaultValue="setlist" className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-widest text-foreground">
            STAGESET
          </span>
          <ConnectionIndicator connected={true} />
        </div>
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="setlist">SETLIST</TabsTrigger>
            <TabsTrigger value="mics">MICS</TabsTrigger>
          </TabsList>
          <Button variant="destructive">LIVE</Button>
        </div>
      </header>

      <TabsContent value="setlist" className="flex-1 overflow-auto">
        <Setlist
          songs={songs}
          microphones={microphones}
          onUpdateSong={updateSong}
          onAddSong={addSong}
          onRemoveSong={removeSong}
          onMoveSong={moveSong}
          onToggleMicrophone={toggleMicrophone}
        />
      </TabsContent>

      <TabsContent value="mics" className="flex-1 overflow-auto">
        <Mics
          microphones={microphones}
          onAddMicrophone={addMicrophone}
          onUpdateMicrophone={updateMicrophone}
          onRemoveMicrophone={removeMicrophone}
        />
      </TabsContent>
    </Tabs>
  );
}
