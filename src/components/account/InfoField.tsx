
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChangeEvent } from "react";

interface InfoFieldProps {
  label: string;
  value: string | undefined;
  icon: React.ElementType;
  name?: string;
  isEditing?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function InfoField({ label, value, icon: Icon, name, isEditing, onChange }: InfoFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-sm font-medium text-muted-foreground flex items-center">
        <Icon className="mr-2 h-4 w-4" /> {label}
      </Label>
      {isEditing && name ? (
        <Input id={name} name={name} value={value || ""} onChange={onChange} className="text-base" />
      ) : (
        <p className="text-base text-foreground bg-secondary/30 p-2.5 rounded-md min-h-[40px] flex items-center">{value || "-"}</p>
      )}
    </div>
  );
}
