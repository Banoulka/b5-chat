import { XIcon } from 'lucide-react';

import { Button } from '../ui/button';
import { useUploaderContext } from './UploaderContext';

export const LocalFileDisplay = () => {
	const { readyFiles, removeFile } = useUploaderContext();

	return (
		<div className="mb-2 flex flex-row gap-2">
			{readyFiles.map((file) => (
				<div key={file.key} className="group relative flex h-18 w-18 items-center gap-2">
					<img src={file.url} alt={file.name} className="h-full w-full rounded-md" />
					<Button
						className="absolute top-0.5 right-0.5 h-6 w-6 rounded-full opacity-0 transition-all group-hover:opacity-100"
						onClick={() => removeFile(file.key)}
						variant="destructive"
						size="icon"
					>
						<XIcon />
					</Button>
				</div>
			))}
		</div>
	);
};
