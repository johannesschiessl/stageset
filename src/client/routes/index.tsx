import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/client/components/ui/Tabs";
import { ConnectionIndicator } from "../components/ConnectionIndicator";
import { Mics } from "../components/mics/Mics";
import { Setlist } from "../components/setlist/Setlist";
import { Button } from "../components/ui/Button";
import { useQuery, useMutation } from "../lib/useWebSocket";
import type { Microphone, Song } from "../../types";

export { Microphone, Song } from "../../types";

export function Index() {
  const { data: microphones = [] } = useQuery("microphones", []);
  const { data: songs = [] } = useQuery("songs", []);

  const { mutate: addMicrophoneApi } = useMutation("addMicrophone");
  const { mutate: updateMicrophoneApi } = useMutation("updateMicrophone");
  const { mutate: removeMicrophoneApi } = useMutation("removeMicrophone");

  const { mutate: addSongApi } = useMutation("addSong");
  const { mutate: updateSongApi } = useMutation("updateSong");
  const { mutate: removeSongApi } = useMutation("removeSong");
  const { mutate: moveSongApi } = useMutation("moveSong");
  const { mutate: toggleMicrophoneApi } = useMutation("toggleMicrophone");

  // Microphone callbacks
  const addMicrophone = async () => {
    try {
      await addMicrophoneApi();
    } catch (err) {
      console.error("Failed to add microphone:", err);
    }
  };

  const updateMicrophone = async (id: string, updates: Partial<Microphone>) => {
    try {
      await updateMicrophoneApi({ id, updates });
    } catch (err) {
      console.error("Failed to update microphone:", err);
    }
  };

  const removeMicrophone = async (id: string) => {
    try {
      await removeMicrophoneApi({ id });
    } catch (err) {
      console.error("Failed to remove microphone:", err);
    }
  };

  // Song callbacks
  const updateSong = async (id: string, updates: Partial<Song>) => {
    try {
      await updateSongApi({ id, updates });
    } catch (err) {
      console.error("Failed to update song:", err);
    }
  };

  const addSong = async () => {
    try {
      await addSongApi();
    } catch (err) {
      console.error("Failed to add song:", err);
    }
  };

  const removeSong = async (id: string) => {
    try {
      await removeSongApi({ id });
    } catch (err) {
      console.error("Failed to remove song:", err);
    }
  };

  const moveSong = async (id: string, direction: "up" | "down") => {
    try {
      await moveSongApi({ id, direction });
    } catch (err) {
      console.error("Failed to move song:", err);
    }
  };

  const toggleMicrophone = async (
    songId: string,
    micId: string,
    type: "microphones" | "monitor",
  ) => {
    try {
      await toggleMicrophoneApi({ songId, micId, type });
    } catch (err) {
      console.error("Failed to toggle microphone:", err);
    }
  };

  return (
    <Tabs defaultValue="setlist" className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-widest text-foreground">
            STAGESET
          </span>
          <ConnectionIndicator />
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
