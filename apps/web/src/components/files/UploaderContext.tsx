import { generateReactHelpers, generateUploadButton } from '@uploadthing/react';
import { createContext, useContext, useState } from 'react';

import { env } from '@/env';

// FIXME: This needs to go in common somehow
import type { UploadThingRouter } from '../../../../api/src/paths/api/uploadthing';
import { api } from '../auth/AuthContext';

export const UploadButton = generateUploadButton<UploadThingRouter>({
	fetch: (input, init) => fetch(input, init),
	url: `${env.VITE_API_URL}`,
});

export const { useUploadThing, uploadFiles } = generateReactHelpers<UploadThingRouter>();

export type LocalFile = {
	name: string;
	hash: string;
	url: string;
	id: string | null;
	key: string;
};

const UploaderContext = createContext<{
	readyFiles: LocalFile[];
	addFile: (file: LocalFile) => void;
	removeFile: (key: string) => void;
	clearFiles: () => void;
} | null>(null);

export const UploaderContextProvider = ({ children }: { children: React.ReactNode }) => {
	const [readyFiles, setReadyFiles] = useState<LocalFile[]>([]);

	const removeFile = (key: string) => {
		setReadyFiles((prv) => prv.filter((f) => f.key !== key));
		api(`/files/${key}`, { method: 'DELETE' });
	};

	const addFile = (file: LocalFile) => {
		setReadyFiles((prv) => [...prv, file]);
	};

	const clearFiles = () => {
		setReadyFiles([]);
	};

	return (
		<UploaderContext.Provider value={{ addFile, clearFiles, readyFiles, removeFile }}>
			{children}
		</UploaderContext.Provider>
	);
};

export const useUploaderContext = () => {
	const ctx = useContext(UploaderContext);
	if (!ctx) throw new Error('UploaderContext not found');

	return ctx;
};
