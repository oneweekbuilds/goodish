"use client";

import * as React from "react";
import { cn } from "./utils";
import { toggleVariants } from "./toggle";

type Variant = "default" | "outline";
type Size = "sm" | "default" | "lg";

interface ToggleGroupContextValue {
  variant?: Variant;
  size?: Size;
  value?: string | string[];
  onValueChange?: (value: string) => void;
  type?: "single" | "multiple";
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  size: "default",
  variant: "default",
});

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  size?: Size;
  value?: string;
  onValueChange?: (value: string) => void;
  type?: "single" | "multiple";
}

function ToggleGroup({
  className,
  variant,
  size,
  children,
  value,
  onValueChange,
  type = "single",
  ...props
}: ToggleGroupProps) {
  const [internalValue, setInternalValue] = React.useState<string | string[]>(
    type === "multiple" ? [] : ""
  );

  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = onValueChange || ((newValue: string) => {
    if (type === "multiple") {
      const arr = Array.isArray(currentValue) ? currentValue : [];
      const newArr = arr.includes(newValue)
        ? arr.filter((v) => v !== newValue)
        : [...arr, newValue];
      setInternalValue(newArr);
    } else {
      setInternalValue(newValue === currentValue ? "" : newValue);
    }
  });

  return (
    <div
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, value: currentValue, onValueChange: handleValueChange, type }}>
        {children}
      </ToggleGroupContext.Provider>
    </div>
  );
}

interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  value: string;
  selected?: boolean;
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  value: itemValue,
  selected,
  onClick,
  ...props
}: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext);
  const finalVariant = context.variant || variant || "default";
  const finalSize = context.size || size || "default";

  // Determine if this item is selected based on parent's value
  let isSelected = false;
  if (selected !== undefined) {
    isSelected = selected;
  } else if (context.value !== undefined) {
    if (context.type === "multiple") {
      isSelected = Array.isArray(context.value) && context.value.includes(itemValue);
    } else {
      isSelected = context.value === itemValue;
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.onValueChange?.(itemValue);
    onClick?.(e);
  };

  return (
    <button
      data-slot="toggle-group-item"
      data-variant={finalVariant}
      data-size={finalSize}
      data-selected={isSelected}
      className={cn(
        toggleVariants({
          variant: finalVariant,
          size: finalSize,
        }),
        "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
        isSelected && "bg-gray-100 border-gray-300",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

export { ToggleGroup, ToggleGroupItem };

