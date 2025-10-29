import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NICHES = [
  "Medical Spas",
  "Law Firms",
  "Dental Practices",
  "Real Estate Agents",
  "Chiropractors",
  "Physical Therapy",
  "Veterinary Clinics",
  "Auto Repair Shops",
  "HVAC Services",
  "Plumbing Services",
  "Roofing Contractors",
  "Insurance Agencies",
  "Accounting Firms",
  "Financial Advisors",
  "Restaurants",
];

interface NicheSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const NicheSelector = ({ value, onChange }: NicheSelectorProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="niche" className="text-sm font-medium text-foreground">
        Business Niche
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="niche" className="w-full">
          <SelectValue placeholder="Select a niche..." />
        </SelectTrigger>
        <SelectContent>
          {NICHES.map((niche) => (
            <SelectItem key={niche} value={niche}>
              {niche}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
