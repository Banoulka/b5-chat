import { Loader2 } from 'lucide-react';

const FullScreenSpinner = () => {
	return (
		<div className="flex h-full flex-col items-center justify-center">
			<Loader2 className="h-10 w-10 animate-spin" />
		</div>
	);
};

export default FullScreenSpinner;
