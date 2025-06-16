import z from 'zod';

export const createMessageSchema = z.object({
	content: z.string().trim().min(1, 'Content is required'),
	modelId: z.string().trim().min(1, 'Model ID is required'),
	attachments: z
		.array(
			z.object({
				key: z.string().trim().min(1, 'Key is required'),
				name: z.string().trim().min(1, 'Name is required'),
			}),
		)
		.optional(),
});

export type CreateMessageSchema = z.infer<typeof createMessageSchema>;
