import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { VCardData } from "@/types/vcard-types";
import { IANA_TIMEZONES } from "@/constants/timezones";
import type { IanaTimezone } from "@/constants/timezones";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function TimezoneSelector() {
  const { watch, setValue } = useFormContext<VCardData>();
  const timezone = watch("timezone") || "";
  const [open, setOpen] = useState(false);

  const groupedTimezones = useMemo(
    () =>
      IANA_TIMEZONES.reduce<Record<string, IanaTimezone[]>>((acc, tz) => {
        if (!acc[tz.group]) {
          acc[tz.group] = [];
        }
        acc[tz.group].push(tz);
        return acc;
      }, {}),
    []
  );

  const selectedTimezone = IANA_TIMEZONES.find(
    (tz) => tz.timezone === timezone
  );

  const handleSelect = (value: string) => {
    setValue("timezone", value, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80">
        <Clock className="mr-1 inline h-3.5 w-3.5" />
        Timezone
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background"
          >
            {selectedTimezone ? (
              <span>{selectedTimezone.label}</span>
            ) : (
              <span className="text-muted-foreground">Select timezone</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command shouldFilter>
            <CommandInput
              placeholder="Search timezone..."
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>No timezone found.</CommandEmpty>
              {Object.entries(groupedTimezones).map(([group, timezones]) => (
                <CommandGroup key={group} heading={group}>
                  {timezones.map((tz) => (
                    <CommandItem
                      key={tz.timezone}
                      value={`${tz.label} ${tz.timezone}`}
                      onSelect={() => handleSelect(tz.timezone)}
                    >
                      <span className="flex-1">{tz.label}</span>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          timezone === tz.timezone
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
