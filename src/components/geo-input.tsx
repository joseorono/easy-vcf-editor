import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { VCardData } from "@/types/vcard-types";
import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

export function GeoInput() {
  const { watch, setValue } = useFormContext<VCardData>();
  const geo = watch("geo") || "";

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  // Parse geo string on mount and when it changes externally
  useEffect(() => {
    if (geo) {
      const parts = geo.split(",").map((p) => p.trim());
      if (parts.length === 2) {
        setLat(parts[0]);
        setLng(parts[1]);
      }
    }
  }, [geo]);

  const handleLatChange = (value: string) => {
    setLat(value);
    if (value && lng) {
      setValue("geo", `${value},${lng}`);
    } else if (!value && !lng) {
      setValue("geo", "");
    }
  };

  const handleLngChange = (value: string) => {
    setLng(value);
    if (lat && value) {
      setValue("geo", `${lat},${value}`);
    } else if (!lat && !value) {
      setValue("geo", "");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80">
        <MapPin className="mr-1 inline h-3.5 w-3.5" />
        Geographic Coordinates
      </Label>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="latitude" className="text-xs text-muted-foreground">
            Latitude
          </Label>
          <Input
            id="latitude"
            type="text"
            placeholder="37.7749"
            value={lat}
            onChange={(e) => handleLatChange(e.target.value)}
            className="bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="longitude" className="text-xs text-muted-foreground">
            Longitude
          </Label>
          <Input
            id="longitude"
            type="text"
            placeholder="-122.4194"
            value={lng}
            onChange={(e) => handleLngChange(e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Enter decimal degrees (e.g., 37.7749, -122.4194 for San Francisco)
      </p>
    </div>
  );
}
