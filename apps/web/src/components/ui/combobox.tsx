import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
	label: string;
	value: string;
}

export interface ComboboxProps<T extends ComboboxOption> {
	options: T[];
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	className?: string;
	disabled?: boolean;
	renderOption?: (option: T, isSelected: boolean) => React.ReactNode;
}

export function Combobox<T extends ComboboxOption>({
	options,
	value,
	onChange,
	placeholder = 'Select option...',
	searchPlaceholder = 'Search...',
	emptyMessage = 'No option found.',
	className,
	disabled = false,
	renderOption,
}: ComboboxProps<T>) {
	const [open, setOpen] = React.useState(false);
	const [internalValue, setInternalValue] = React.useState('');

	const currentValue = value !== undefined ? value : internalValue;
	const handleValueChange = onChange || setInternalValue;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					role="combobox"
					aria-expanded={open}
					className={cn('w-fit justify-between', className)}
					disabled={disabled}
				>
					{currentValue ? options.find((option) => option.value === currentValue)?.label : placeholder}
					<ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-fit max-w-[70vw] p-0" side="top" align="start">
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									onSelect={(selectedValue) => {
										const newValue = selectedValue === currentValue ? '' : selectedValue;
										handleValueChange(newValue);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={cn(
											'mr-2 h-4 w-4',
											currentValue === option.value ? 'opacity-100' : 'opacity-0',
										)}
									/>
									{renderOption ? renderOption(option, currentValue === option.value) : option.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
