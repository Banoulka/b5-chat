import type { API_ThreadMessagesResponse } from '@b5-chat/common';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { FileIcon } from 'lucide-react';
import { useMemo } from 'react';

import { getMessageOpts } from '@/hooks/queries';
import { useScrollContainer } from '@/hooks/use-scroll-container';
import { useStream } from '@/hooks/use-stream';
import { mergeRefs } from '@/lib/merge-refs';
import { cn } from '@/lib/utils';

import { api } from '../auth/AuthContext';
import MarkdownDisplay from '../MarkdownDisplay';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type Props = {
	bottomRefHeight: number;
	threadId: string;
	stream: ReturnType<typeof useStream>;
	ref?: React.RefObject<HTMLDivElement | null>;
};

export type LocalMessage = {
	type: 'local';
	localId: string;
	content: string;
};

export type QueryTypeMessageData = Omit<API_ThreadMessagesResponse, 'data'> & { data: MessageData[] };

type MessageData = API_ThreadMessagesResponse['data'][number] | LocalMessage;

const SCROLL_THRESHOLD = 70;

const MessageList = ({ bottomRefHeight, threadId, stream, ref }: Props) => {
	const { data, isFetching, isFetchPreviousPageError, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useInfiniteQuery<QueryTypeMessageData>({
			getNextPageParam: (lastPage) => lastPage?.meta?.nextCursor,
			initialPageParam: undefined,
			placeholderData: keepPreviousData,
			queryFn: ({ pageParam }) =>
				api(pageParam ? `/threads/${threadId}/messages?from=${pageParam}` : `/threads/${threadId}/messages`),
			...getMessageOpts(threadId),
		});

	const { containerRef: scrollRef, isAtTopRef } = useScrollContainer({
		anchorBottomDeps: [bottomRefHeight],
		isLoading,
		onReachTop: () => {
			if (hasNextPage && !isFetchingNextPage) {
				fetchNextPage();
			}
		},
		threshold: SCROLL_THRESHOLD,
	});

	const flatPages = useMemo(() => {
		if (!data) return [];
		return [...data.pages].reverse().flatMap((page) => [...page.data].reverse());
	}, [data]);

	const mergedRefs = useMemo(() => mergeRefs([scrollRef, ref]), [scrollRef, ref]);

	const shouldShowSkeleton = !isLoading && isFetching && isAtTopRef.current;

	return (
		<div
			style={{ height: `calc(100vh - ${bottomRefHeight}px)` }}
			className="bg-secondary dark:bg-background flex h-full w-full flex-col overflow-y-auto pt-4"
			ref={mergedRefs}
		>
			{isFetchPreviousPageError && <div>Error</div>}
			{shouldShowSkeleton &&
				new Array(10).fill(0).map((_, index) => (
					<div key={index} className="m-2 mx-auto flex w-[70%] flex-col items-end">
						<Skeleton className={cn('bg-muted dark:bg-muted/40 m-2 flex w-full flex-col rounded p-4')} />
					</div>
				))}
			{flatPages?.map((message) => (
				<MessageDisplay message={message} key={message.type === 'local' ? message.localId : message.id} />
			))}
			{/* TODO: Move to query cache */}
			{stream.isStreaming && (
				<div className="m-2 mx-auto flex w-[70%] flex-col items-end">
					<p className={cn('w-full rounded bg-green-200 p-2 dark:bg-green-700')}>
						<MarkdownDisplay markdown={stream.tokens} />
					</p>
				</div>
			)}
		</div>
	);
};

const MessageDisplay = ({ message }: { message: MessageData }) => {
	const attachments = useMemo(() => (message.type === 'local' ? [] : message.attachments), [message]);

	return (
		<div
			className="m-2 mx-auto flex w-[70%] flex-col items-end"
			key={message.type === 'local' ? message.localId : message.id}
		>
			<div
				className={cn(
					'rounded-2xl px-4 py-2',
					message.type === 'user' || message.type === 'local'
						? 'bg-secondary w-fit max-w-[70%]'
						: 'w-full bg-transparent',
				)}
			>
				{message.type === 'agent' ? <MarkdownDisplay markdown={message.content} /> : <p>{message.content}</p>}
				<div className="flex flex-row gap-4">
					{attachments.map((file) => {
						const isImage = file.name?.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i);
						return (
							<Tooltip key={file.key}>
								<TooltipTrigger>
									{isImage ? (
										<img
											src={file.url}
											alt={file.name}
											className="mt-2 max-h-[10em] max-w-[10em] rounded object-cover shadow"
										/>
									) : (
										<div className="mt-2 max-h-[10em] max-w-[10em] rounded object-cover p-4 shadow">
											<FileIcon size={48} />
										</div>
									)}
								</TooltipTrigger>
								<TooltipContent>
									<p>{file.name}</p>
								</TooltipContent>
							</Tooltip>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default MessageList;
