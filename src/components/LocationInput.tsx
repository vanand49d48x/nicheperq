import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocationInputProps {
  city: string;
  onCityChange: (value: string) => void;
  radius: string;
  onRadiusChange: (value: string) => void;
}

const RADIUS_OPTIONS = ["5", "10", "25", "50", "100"];

export const LocationInput = ({ city, onCityChange, radius, onRadiusChange }: LocationInputProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="city" className="text-sm font-medium text-foreground">
          City or Zipcode
        </label>
        <Input
          id="city"
          type="text"
          placeholder="Enter city or zipcode..."
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="radius" className="text-sm font-medium text-foreground">
          Search Radius (miles)
        </label>
        <Select value={radius} onValueChange={onRadiusChange}>
          <SelectTrigger id="radius">
            <SelectValue placeholder="Select radius..." />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option} miles
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
