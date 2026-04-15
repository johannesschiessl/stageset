import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/Card";
import { Link } from "@tanstack/react-router";
import { TriangleIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Microphone, Song } from "../../types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Progress } from "../components/ui/Progress";
import { useQuery } from "../lib/useWebSocket";

function micLabel(mic: Microphone) {
  return mic.name ? `${mic.number} – ${mic.name}` : String(mic.number);
}

export function Live() {
  const { data: songs = [] } = useQuery("songs", []);
  const { data: microphones = [] } = useQuery("microphones", []);
  const [currentIndex, setCurrentIndex] = useState(0);

  const goForward = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, songs.length - 1));
  }, [songs.length]);

  const goBack = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowRight") {
        e.preventDefault();
        goForward();
      } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goForward, goBack]);

  const currentSong: Song | undefined = songs[currentIndex];
  const prevSong: Song | undefined = songs[currentIndex - 1];
  const nextSong: Song | undefined = songs[currentIndex + 1];

  const progressValue =
    songs.length > 0 ? ((currentIndex + 1) / songs.length) * 100 : 0;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-2 p-2 border-b">
        <Link to="/">
          <Button variant="destructive">BACK</Button>
        </Link>
        <div className="flex-1">
          <Progress value={progressValue} />
        </div>
        <Badge variant="outline">
          {songs.length > 0 ? currentIndex + 1 : 0} OF {songs.length} SONGS
        </Badge>
      </header>

      <div className="flex flex-1 items-center">
        <button
          className="border-r w-20 flex h-full flex-col items-center justify-center gap-2 px-4 transition-colors hover:bg-muted disabled:opacity-30"
          onClick={goBack}
          disabled={!prevSong}
        >
          <TriangleIcon fill="white" className="h-6 w-6 -rotate-90" />
          <span className="text-xs text-muted-foreground max-w-20 truncate">
            {prevSong ? prevSong.title || "Untitled" : ""}
          </span>
        </button>

        {/* Center content */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-auto py-6">
          {currentSong ? (
            <>
              {/* Song info */}
              <div className="flex flex-col gap-2 text-center">
                <span className="text-muted-foreground font-bold text-2xl">
                  #{currentIndex + 1}
                </span>
                <span className="text-6xl font-bold">
                  {currentSong.title || "Untitled"}
                </span>
                {currentSong.artist && (
                  <span className="text-muted-foreground text-3xl font-bold">
                    {currentSong.artist}
                  </span>
                )}
              </div>

              {/* Mics & Monitor */}
              <div className="grid w-3/4 grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>MICROPHONES</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {currentSong.microphones.length > 0 ? (
                      currentSong.microphones.map((micId) => {
                        const mic = microphones.find(
                          (m: Microphone) => m.id === micId,
                        );
                        return (
                          <Badge key={micId}>
                            {mic ? micLabel(mic) : micId}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        None
                      </span>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>MONITOR</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1">
                    {currentSong.monitor.length > 0 ? (
                      currentSong.monitor.map((micId) => {
                        const mic = microphones.find(
                          (m: Microphone) => m.id === micId,
                        );
                        return (
                          <Badge key={micId} variant="secondary">
                            {mic ? micLabel(mic) : micId}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        None
                      </span>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {currentSong.notes && (
                <Card className="w-3/4">
                  <CardHeader>
                    <CardTitle>NOTES</CardTitle>
                  </CardHeader>
                  <CardContent>{currentSong.notes}</CardContent>
                </Card>
              )}
            </>
          ) : (
            <span className="text-2xl text-muted-foreground">
              No songs in the setlist
            </span>
          )}
        </div>

        <button
          className="flex border-l w-20 h-full flex-col items-center justify-center gap-2 px-4 transition-colors hover:bg-muted disabled:opacity-30"
          onClick={goForward}
          disabled={!nextSong}
        >
          <TriangleIcon fill="white" className="h-6 w-6 rotate-90" />
          <span className="text-xs text-muted-foreground max-w-20 truncate">
            {nextSong ? nextSong.title || "Untitled" : ""}
          </span>
        </button>
      </div>
    </div>
  );
}
