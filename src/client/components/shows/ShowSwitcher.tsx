import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/client/components/ui/Combobox";
import { Button } from "../ui/Button";

const mockedShows = ["DEFAULT", "SHOWTIME", "SUMMER CONCERT"];

export function ShowSwitcher() {
  return (
    <Combobox items={mockedShows}>
      <ComboboxInput placeholder="SHOW" />
      <ComboboxContent>
        <ComboboxEmpty>
          <Button>NEW SHOW</Button>
        </ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
