import { Loader2Icon, PaperclipIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { UploadButton, useUploaderContext } from './UploaderContext';

const UploaderButton = () => {
	const { addFile } = useUploaderContext();
	return (
		<UploadButton
			endpoint="imageUploader"
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
			content={{
				allowedContent: () => <div></div>,
				button: (arg) => (
					<span
						className={cn(
							"hover:bg-accent hover:text-accent-foreground ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-2.5 aria-invalid:focus-visible:ring-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						)}
					>
						{arg.isUploading ? 'Cancel Upload' : 'Attach'}
						{arg.isUploading ? (
							<Loader2Icon className="animate-spin" size={16} />
						) : (
							<PaperclipIcon size={16} />
						)}
					</span>
				),
				// button: (
				// 	<Button type="submit" variant="ghost" size="sm">
				// 		Attach
				// 		<PaperclipIcon />
				// 	</Button>
				// ),
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
