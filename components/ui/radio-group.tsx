'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(
  undefined
);

function useRadioGroup() {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error('RadioGroup components must be used within RadioGroup');
  }
  return context;
}

interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  children: React.ReactNode;
  className?: string;
}

function RadioGroup({
  value: controlledValue,
  defaultValue,
  onValueChange,
  name,
  children,
  className,
}: RadioGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue || ''
  );

  const value = controlledValue ?? uncontrolledValue;
  const handleValueChange = onValueChange ?? setUncontrolledValue;

  return (
    <RadioGroupContext.Provider value={{ value, onValueChange: handleValueChange, name }}>
      <div className={cn('grid gap-2', className)} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, disabled, ...props }, ref) => {
    const { value: selectedValue, onValueChange, name } = useRadioGroup();
    const isChecked = selectedValue === value;

    return (
      <button
        type="button"
        role="radio"
        aria-checked={isChecked}
        disabled={disabled}
        className={cn(
          'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onClick={() => !disabled && onValueChange(value)}
      >
        <input
          ref={ref}
          type="radio"
          name={name}
          value={value}
          checked={isChecked}
          disabled={disabled}
          onChange={() => onValueChange(value)}
          className="sr-only"
          {...props}
        />
        {isChecked && (
          <span className="flex items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
          </span>
        )}
      </button>
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
