import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
	size?: 'sm' | 'md' | 'lg';
	variant?: 'primary' | 'secondary' | 'muted';
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
	({ className, size = 'md', variant = 'primary', ...props }, ref) => {
		const sizeClasses = {
			lg: 'w-8 h-8',
			md: 'w-6 h-6',
			sm: 'w-4 h-4',
		};

		const variantClasses = {
			muted: 'border-muted-foreground',
			primary: 'border-primary',
			secondary: 'border-secondary',
		};

		return (
			<div
				ref={ref}
				className={cn(
					'animate-spin rounded-full border-2 border-t-transparent',
					sizeClasses[size],
					variantClasses[variant],
					className,
				)}
				{...props}
			/>
		);
	},
);

Spinner.displayName = 'Spinner';

interface LoadingSpinnerProps {
	size?: 'sm' | 'md' | 'lg';
	variant?: 'primary' | 'secondary' | 'muted';
	text?: string;
	className?: string;
}

export const LoadingSpinner = ({
	size = 'md',
	variant = 'primary',
	text = 'Loading...',
	className,
}: LoadingSpinnerProps) => {
	return (
		<div className={cn('flex flex-col items-center justify-center gap-2', className)}>
			<Spinner size={size} variant={variant} />
			{text && <p className="text-muted-foreground animate-pulse text-sm">{text}</p>}
		</div>
	);
};

export { Spinner };
