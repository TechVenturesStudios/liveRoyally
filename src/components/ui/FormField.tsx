
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
    <div className={cn("mb-4", className)}>
      <Label htmlFor={name} className="block mb-2 text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      {type === "select" ? (
        <Select value={value} onValueChange={onSelectChange}>
          <SelectTrigger className="brand-input w-full">
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
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={name} 
            checked={checked} 
            onCheckedChange={onCheckboxChange} 
            className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple" 
          />
          <label htmlFor={name} className="text-sm text-gray-700">{placeholder}</label>
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
          className="brand-input w-full"
        />
      )}
    </div>
  );
};

export default FormField;
