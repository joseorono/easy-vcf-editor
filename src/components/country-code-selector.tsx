import { useState } from "react";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { countries } from "countries-list";

interface CountryCodeSelectorProps {
  value?: string;
  onSelect: (countryCode: string) => void;
  inline?: boolean;
}

export function CountryCodeSelector({
  value,
  onSelect,
  inline = false,
}: CountryCodeSelectorProps) {
  const [open, setOpen] = useState(false);

  // Build country list with phone codes
  const countryList = Object.entries(countries)
    .map(([code, country]) => {
      const phoneCode = Array.isArray(country.phone)
        ? country.phone[0]
        : country.phone;
      return {
        code,
        name: country.name,
        phone: phoneCode,
      };
    })
    .filter((c) => c.phone)
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedCountry = countryList.find(
    (c) => `+${c.phone}` === value
  );

  const trigger = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn(
        "justify-between",
        inline ? "w-24 h-9 px-2 text-xs" : "w-full"
      )}
    >
      {selectedCountry ? (
        <span className={inline ? "text-xs" : ""}>
          +{selectedCountry.phone}
        </span>
      ) : (
        <span className={cn("text-muted-foreground", inline ? "text-xs" : "")}>
          Code
        </span>
      )}
      <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
    </Button>
  );

  const content = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {inline ? trigger : <div className="w-full">{trigger}</div>}
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", inline ? "w-48" : "w-full")}>
        <Command shouldFilter>
          <CommandInput
            placeholder="Search country or code..."
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countryList.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} +${String(country.phone)}`}
                  onSelect={() => {
                    const newValue = `+${String(country.phone)}`;
                    onSelect(newValue === value ? "" : newValue);
                    setOpen(false);
                  }}
                >
                  <span className="flex-1">
                    {country.name} (+{country.phone})
                  </span>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === `+${String(country.phone)}`
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Country Code</Label>
      {content}
    </div>
  );
}
