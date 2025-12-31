import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import * as RPNInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, 'onChange'> & {
    onChange?: (value: RPNInput.Value) => void;
  };

const PhoneInput = React.forwardRef<
  React.ElementRef<typeof RPNInput.default>,
  PhoneInputProps
>(({ className, onChange, ...props }, ref) => {
  return (
    <RPNInput.default
      ref={ref}
      defaultCountry={props.defaultCountry ?? 'MA'}
      flagComponent={FlagComponent}
      countrySelectComponent={CountrySelect}
      inputComponent={InputComponent}
      className={cn(
        // ✅ ONE rounded container only
        'flex items-center h-10 rounded-xl border border-input bg-background overflow-hidden shadow-sm',
        'focus-within:ring-2 focus-within:ring-ring',
        className
      )}
      // @ts-ignore
      onChange={(value) => onChange?.(value || '')}
      {...props}
    />
  );
});
PhoneInput.displayName = 'PhoneInput';

/* ---------------- INPUT ---------------- */

const InputComponent = React.forwardRef<HTMLInputElement, any>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        // ✅ Same height as button
        'flex-1 h-10 min-w-0 bg-transparent px-3 text-sm text-foreground outline-none',
        className
      )}
      {...props}
    />
  )
);
InputComponent.displayName = 'InputComponent';

/* ---------------- COUNTRY SELECT ---------------- */

type CountrySelectOption = {
  label: string;
  value: RPNInput.Country;
};

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: CountrySelectOption[];
};

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (country: RPNInput.Country) => {
    onChange(country);
    setOpen(false); // ✅ close popover
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          className={cn(
            // ✅ NO rounding here — container handles it
            'h-10 px-3 flex items-center gap-2 border-r border-input rounded-none',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          <FlagComponent country={value} countryName={value} />
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un pays..." />
          <CommandEmpty>Aucun pays trouvé.</CommandEmpty>

          <CommandList>
            <ScrollArea className="h-72">
              <CommandGroup>
                {options
                  .filter((o) => o.value)
                  .map((option) => (
                    <CommandItem
                      key={option.value}
                      className="gap-2"
                      onSelect={() => handleSelect(option.value)}
                    >
                      <FlagComponent
                        country={option.value}
                        countryName={option.label}
                      />
                      <span className="flex-1 text-sm">
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        +{RPNInput.getCountryCallingCode(option.value)}
                      </span>
                      <CheckIcon
                        className={cn(
                          'ml-2 h-4 w-4',
                          option.value === value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/* ---------------- FLAG ---------------- */

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex items-center justify-center w-6 h-4 overflow-hidden rounded-sm">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};
FlagComponent.displayName = 'FlagComponent';

export { PhoneInput };
