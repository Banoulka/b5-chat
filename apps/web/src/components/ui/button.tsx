import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	"inline-flex transition-all cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 focus-visible:ring-4 focus-visible:outline-1 aria-invalid:focus-visible:ring-0",
	{
		defaultVariants: {
			size: 'default',
			variant: 'default',
		},
		variants: {
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				icon: 'size-9',
				lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
				sm: 'h-8 rounded-md px-3 has-[>svg]:px-2.5',
			},
			variant: {
				default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
				destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
				outline: 'border border-input bg-background shadow-xs hover:bg-secondary hover:text-accent-foreground',
				secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
			},
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : 'button';

	return <Comp data-slot="button" className={cn(buttonVariants({ className, size, variant }))} {...props} />;
}

export { Button, buttonVariants };
