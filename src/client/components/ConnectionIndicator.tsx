import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";

export function ConnectionIndicator({ connected }: { connected: boolean }) {
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
