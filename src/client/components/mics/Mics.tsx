import { Badge } from "@/client/components/ui/Badge";
import { Button } from "@/client/components/ui/Button";
import { Card, CardContent } from "@/client/components/ui/Card";
import { Input } from "@/client/components/ui/Input";
import type { Microphone } from "@/client/routes/index";
import { Trash2 } from "lucide-react";

interface MicsProps {
  microphones: Microphone[];
  onAddMicrophone: () => void;
  onUpdateMicrophone: (id: string, updates: Partial<Microphone>) => void;
  onRemoveMicrophone: (id: string) => void;
}

export function Mics({
  microphones,
  onAddMicrophone,
  onUpdateMicrophone,
  onRemoveMicrophone,
}: MicsProps) {
  return (
    <div className="mb-10">
      <div className="mb-2 flex items-center justify-between px-2">
        <span className="text-muted-foreground font-medium">
          {microphones.length} Mics
        </span>
        <Button onClick={onAddMicrophone} className="w-fit">
          Add Mic
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 px-2">
        {microphones.map((mic) => (
          <Card key={mic.id} size="sm" className="relative group">
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              onClick={() => onRemoveMicrophone(mic.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>

            <CardContent className="flex flex-col items-center gap-2">
              <Badge variant="default" className="p-0">
                <input
                  value={mic.number}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = parseInt(val, 10);
                    if (val === "" || !isNaN(num)) {
                      onUpdateMicrophone(mic.id, {
                        number: val === "" ? 0 : num,
                      });
                    }
                  }}
                  className="h-5 w-8 bg-transparent text-center text-xs font-medium text-inherit outline-none"
                />
              </Badge>
              <Input
                placeholder="Name"
                value={mic.name}
                onChange={(e) =>
                  onUpdateMicrophone(mic.id, { name: e.target.value })
                }
                className="border-transparent bg-transparent dark:bg-transparent transition-colors focus-visible:border-input focus-visible:bg-input/30 text-center"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
