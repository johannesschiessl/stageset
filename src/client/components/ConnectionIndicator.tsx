import { useWebSocketConnection } from "@/client/lib/useWebSocket";
import { MicVocalIcon } from "lucide-react";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";

export function ConnectionIndicator() {
  const connected = useWebSocketConnection();

  if (connected) {
    return (
      <Badge>
        <MicVocalIcon className="size-4" />
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      <Spinner />
    </Badge>
  );
}
