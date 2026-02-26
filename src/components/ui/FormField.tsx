
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange?: (value: string) => void;
  onCheckboxChange?: (checked: boolean) => void;
  checked?: boolean;
  className?: string;
}

const FormField = ({
  label,
  name,
  type,
  placeholder,
  required = false,
  options = [],
  value,
  onChange,
  onSelectChange,
  onCheckboxChange,
  checked,
  className,
}: FormFieldProps) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      {type !== "checkbox" && (
        <Label htmlFor={name} className="block text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      {type === "select" ? (
        <Select value={value} onValueChange={onSelectChange}>
          <SelectTrigger className="brand-input w-full h-11">
            <SelectValue placeholder={placeholder || `Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === "checkbox" ? (
        <div className="flex items-start space-x-3 py-1">
          <Checkbox 
            id={name} 
            checked={checked} 
            onCheckedChange={onCheckboxChange} 
            className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
          />
          <label htmlFor={name} className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
            {placeholder}
          </label>
        </div>
      ) : (
        <Input
          type={type}
          id={name}
          name={name}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          className="brand-input w-full h-11"
        />
      )}
    </div>
  );
};

export default FormField;
