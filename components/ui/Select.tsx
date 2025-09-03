// src/components/ui/Select.tsx
import React, { createContext, useContext, useState } from 'react';

// Context untuk state management
interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

const useSelect = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
};

// Main Select Component
interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> & {
  Trigger: typeof SelectTrigger;
  Value: typeof SelectValue;
  Content: typeof SelectContent;
  Item: typeof SelectItem;
} = ({
  value,
  defaultValue = "",
  onValueChange,
  children
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <SelectContext.Provider value={{
      value: currentValue,
      onValueChange: handleValueChange,
      open,
      setOpen
    }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// SelectTrigger Component
interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  children, 
  className = "" 
}) => {
  const { setOpen, open } = useSelect();

  return (
    <div
      className={`flex items-center justify-between p-2 border rounded-md cursor-pointer ${className}`}
      onClick={() => setOpen(!open)}
    >
      {children}
    </div>
  );
};

// SelectValue Component
interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ 
  placeholder = "Select..." 
}) => {
  const { value } = useSelect();

  return (
    <span>
      {value || placeholder}
    </span>
  );
};

// SelectContent Component
interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent: React.FC<SelectContentProps> = ({ 
  children, 
  className = "" 
}) => {
  const { open } = useSelect();

  if (!open) return null;

  return (
    <div className={`absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 ${className}`}>
      {children}
    </div>
  );
};

// SelectItem Component
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const SelectItem: React.FC<SelectItemProps> = ({ 
  value, 
  children, 
  className = "" 
}) => {
  const { onValueChange, setOpen } = useSelect();

  const handleClick = () => {
    onValueChange(value);
    setOpen(false);
  };

  return (
    <div
      className={`p-2 cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

// Attach subcomponents to Select
Select.Trigger = SelectTrigger;
Select.Value = SelectValue;
Select.Content = SelectContent;
Select.Item = SelectItem;

// Export types
export type { SelectValueProps, SelectItemProps, SelectTriggerProps, SelectContentProps };