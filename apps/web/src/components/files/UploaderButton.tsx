import { ImageIcon, Loader2Icon, PaperclipIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { UploadButton, useUploaderContext } from './UploaderContext';

type Props = {
	type: 'file' | 'image';
};

const UploaderButton = ({ type }: Props) => {
	const { addFile } = useUploaderContext();

	const icon = type === 'file' ? <PaperclipIcon size={16} /> : <ImageIcon size={16} />;
	const content = type === 'file' ? 'Attach' : 'Upload';

	const imgTypes = ['png', 'jpg', 'webp', 'svg', 'bmp'];
	const fileTypes = ['pdf', 'txt', 'doc'];

	return (
		<UploadButton
			endpoint={(route) => (type === 'file' ? route.fileUploader : route.imageUploader)}
			onClientUploadComplete={(res) => {
				const files = res.map((r) => ({
					hash: r.fileHash,
					id: r.customId,
					key: r.key,
					name: r.name,
					url: r.ufsUrl,
				}));

				files.forEach(addFile);
			}}
			appearance={{
				allowedContent: { display: 'none' },
			}}
			content={{
				allowedContent: null,
				button: (arg) => (
					<Tooltip>
						<TooltipTrigger asChild>
							<span
								className={cn(
									"hover:bg-accent hover:text-accent-foreground ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-2.5 aria-invalid:focus-visible:ring-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
								)}
							>
								<span className="hidden md:block">{arg.isUploading ? 'Cancel upload' : content}</span>
								{arg.isUploading ? <Loader2Icon className="animate-spin" size={16} /> : icon}
							</span>
						</TooltipTrigger>
						<TooltipContent className="whitespace-pre-wrap">
							{type === 'file'
								? `Attach a file.\nAccepts: ${[...fileTypes, ...imgTypes].join(', ')}`
								: `Upload an image.\nAccepts: ${imgTypes.join(', ')}`}
						</TooltipContent>
					</Tooltip>
				),
			}}
			config={{
				appendOnPaste: true,
				cn: cn,
				mode: 'auto',
			}}
		/>
	);
};

export default UploaderButton;
