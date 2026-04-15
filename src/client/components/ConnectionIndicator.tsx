import { useWebSocketConnection } from "@/client/lib/useWebSocket";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";

export function ConnectionIndicator() {
  const connected = useWebSocketConnection();

  if (connected) {
    return <Badge>Connected</Badge>;
  }

  return (
    <Badge variant="destructive">
      <Spinner />
      Connecting
    </Badge>
  );
}
