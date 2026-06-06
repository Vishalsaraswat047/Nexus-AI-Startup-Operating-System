import * as React from "react";
import { ChevronDown, Check } from "lucide-react";

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerText: string;
  setTriggerText: (text: string) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

export interface SelectProps {
  children?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({
  children,
  value: controlledValue,
  defaultValue,
  onValueChange,
}) => {
  const [value, setValue] = React.useState(controlledValue || defaultValue || "");
  const [isOpen, setIsOpen] = React.useState(false);
  const [triggerText, setTriggerText] = React.useState("");

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
    }
  }, [controlledValue]);

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setValue(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        isOpen,
        setIsOpen,
        triggerText,
        setTriggerText,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<React.HTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = "",
  ...props
}) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within Select");

  return (
    <button
      type="button"
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={`flex h-11 w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition cursor-pointer select-none ${className}`}
      {...props}
    >
      {context.triggerText || children || "Select an option..."}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder = "Select..." }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");
  return <span>{context.triggerText || placeholder}</span>;
};

export const SelectContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within Select");

  if (!context.isOpen) return null;

  return (
    <>
      {/* Background overlay to close option lists when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={() => context.setIsOpen(false)} />
      <div
        className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card p-1 text-on-surface shadow-xl ring-1 ring-black/5 focus:outline-none ${className}`}
      >
        {children}
      </div>
    </>
  );
};

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  className = "",
  ...props
}) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within Select");

  const isSelected = context.value === value;

  React.useEffect(() => {
    if (isSelected) {
      context.setTriggerText(String(children));
    }
  }, [isSelected, children]);

  const handleSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    context.onValueChange?.(value);
    context.setTriggerText(String(children));
  };

  return (
    <div
      onClick={handleSelect}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none hover:bg-muted focus:bg-muted ${
        isSelected ? "text-primary font-medium bg-surface-container-low" : "text-on-surface"
      } ${className}`}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
      {children}
    </div>
  );
};
