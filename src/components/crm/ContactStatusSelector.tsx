import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContactStatusSelectorProps {
  currentStatus: string;
  onChange: (status: string) => void;
}

const statusOptions = [
  { value: "new", label: "New", color: "text-slate-600" },
  { value: "attempted", label: "Attempted", color: "text-yellow-600" },
  { value: "connected", label: "Connected", color: "text-blue-600" },
  { value: "in_conversation", label: "In Conversation", color: "text-purple-600" },
  { value: "active_partner", label: "Active Partner", color: "text-green-600" },
  { value: "do_not_contact", label: "Do Not Contact", color: "text-red-600" },
];

export const ContactStatusSelector = ({ currentStatus, onChange }: ContactStatusSelectorProps) => {
  return (
    <Select value={currentStatus} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <span className={option.color}>{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
