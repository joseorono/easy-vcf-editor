import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Plus, X, ChevronsUpDown, Check } from "lucide-react";
import type { VCardData } from "@/types/vcard-types";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { languages } from "countries-list";
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
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const { watch, setValue } = useFormContext<VCardData>();
  const selectedLanguages = watch("languages") || "";
  const [open, setOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>("");

  const languageList = selectedLanguages
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  // Build language list from countries-list
  const languageOptions = useMemo(() => {
    return Object.entries(languages)
      .map(([code, lang]) => ({
        code,
        name: lang.name,
        native: lang.native,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const addLanguage = () => {
    if (!selectedLang) return;

    const current = languageList;
    if (!current.includes(selectedLang)) {
      const updated = [...current, selectedLang].join(", ");
      setValue("languages", updated);
    }
    setSelectedLang("");
    setOpen(false);
  };

  const removeLanguage = (lang: string) => {
    const updated = languageList.filter((l) => l !== lang).join(", ");
    setValue("languages", updated);
  };

  const getLangDisplay = (code: string) => {
    const lang = languageOptions.find((l) => l.code === code);
    if (!lang) return code;
    return lang.native ? `${lang.name} (${lang.native})` : lang.name;
  };

  const selectedLangInfo = languageOptions.find((l) => l.code === selectedLang);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80">
        Languages
      </Label>

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between bg-background"
            >
              {selectedLangInfo ? (
                <span>
                  {selectedLangInfo.native
                    ? `${selectedLangInfo.name} (${selectedLangInfo.native})`
                    : selectedLangInfo.name}{" "}
                  [{selectedLangInfo.code}]
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Select a language
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command shouldFilter>
              <CommandInput
                placeholder="Search language..."
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandGroup>
                  {languageOptions.map((lang) => (
                    <CommandItem
                      key={lang.code}
                      value={`${lang.name} ${lang.native} ${lang.code}`}
                      onSelect={() => {
                        setSelectedLang(lang.code);
                        setOpen(false);
                      }}
                    >
                      <span className="flex-1">
                        {lang.native
                          ? `${lang.name} (${lang.native})`
                          : lang.name}{" "}
                        [{lang.code}]
                      </span>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedLang === lang.code
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

        <Button
          id="add-language-btn"
          type="button"
          variant="outline"
          onClick={addLanguage}
          disabled={!selectedLang}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>

      {languageList.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {languageList.map((lang) => (
            <Badge
              key={lang}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {getLangDisplay(lang)}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeLanguage(lang)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
