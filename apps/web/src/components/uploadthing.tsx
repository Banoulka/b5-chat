import { generateUploadButton } from '@uploadthing/react';

import { env } from '@/env';

// FIXME: This needs to go in common somehow
import type { UploadThingRouter } from '../../../api/src/paths/api/uploadthing';

export const UploadButton = generateUploadButton<UploadThingRouter>({
	url: `${env.VITE_API_URL}/api/uploadthing`,
});
