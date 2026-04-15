import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/client/components/ui/Tabs";
import { Setlist } from "../components/setlist/Setlist";
import { Button } from "../components/ui/Button";

export function Index() {
  return (
    <Tabs defaultValue="setlist" className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm font-bold tracking-widest text-foreground">
          STAGESET
        </span>
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="setlist">SETLIST</TabsTrigger>
            <TabsTrigger value="mics">MICS</TabsTrigger>
          </TabsList>
          <Button variant="destructive">LIVE</Button>
        </div>
      </header>

      <TabsContent value="setlist" className="flex-1 overflow-auto">
        <Setlist />
      </TabsContent>

      <TabsContent value="mics" className="flex-1 overflow-auto p-4">
        <p className="text-muted-foreground">Coming soon</p>
      </TabsContent>
    </Tabs>
  );
}
