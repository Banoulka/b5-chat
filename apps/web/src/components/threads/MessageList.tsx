import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { ArrowDownIcon, FileIcon, LucideTextCursor } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { getMessageOpts } from '@/hooks/queries';
import { usePersistence } from '@/hooks/use-persistence';
import { useScrollContainer } from '@/hooks/use-scroll-container';
import { useStream } from '@/hooks/use-stream';
import { mergeRefs } from '@/lib/merge-refs';
import type { ThreadMessagesResponse } from '@/lib/threads/persistence';
import { cn } from '@/lib/utils';

import MarkdownDisplay from '../MarkdownDisplay';
import { Button } from '../ui/button';
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

export type QueryTypeMessageData = Omit<ThreadMessagesResponse, 'data'> & { data: MessageData[] };

type MessageData = ThreadMessagesResponse['data'][number] | LocalMessage;

const SCROLL_THRESHOLD = 70;

const MessageList = ({ bottomRefHeight, threadId, stream, ref }: Props) => {
	const persistence = usePersistence();

	const { data, isFetching, isFetchPreviousPageError, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useInfiniteQuery<QueryTypeMessageData>({
			getNextPageParam: (lastPage) => lastPage?.meta?.nextCursor,
			initialPageParam: undefined,
			placeholderData: keepPreviousData,
			queryFn: async ({ pageParam }) => {
				const response = await persistence.listMessagesForThread(threadId, pageParam as number | null);
				return response as QueryTypeMessageData;
			},
			...getMessageOpts(threadId),
		});

	const [showScrollButton, setShowScrollButton] = useState(false);

	const { containerRef: scrollRef, isAtTopRef } = useScrollContainer({
		anchorBottomDeps: [bottomRefHeight],
		isLoading,
		onReachTop: () => {
			if (hasNextPage && !isFetchingNextPage) {
				fetchNextPage();
			}
		},
		onScroll: (top, height) => {
			// if we are about a quarter of the way up the page, show the scroll to bottom button
			setShowScrollButton(height > 3000 && top < height * 0.75);
		},
		threshold: SCROLL_THRESHOLD,
	});

	const flatPages = useMemo(() => {
		if (!data) return [];
		return data.pages.flatMap((page) => page.data);
	}, [data]);

	const mergedRefs = useMemo(() => mergeRefs([scrollRef, ref]), [scrollRef, ref]);

	const shouldShowSkeleton = !isLoading && isFetching && isAtTopRef.current && (data?.pages.length ?? 0) > 1;

	const scrollToBottom = () => {
		const current = scrollRef.current;

		if (current) {
			current.scrollTo({ behavior: 'smooth', top: current.scrollHeight });
		}
	};

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
				<>
					{stream.tokens.length === 0 && (
						<div className="relative m-2 mx-auto flex w-[70%] flex-row items-center">
							<LucideTextCursor className="h-4 w-4" />
							<AnimatedDots />
						</div>
					)}

					<div className="m-2 mx-auto flex w-[70%] flex-col items-end">
						<p className={cn('w-full rounded p-2')}>
							<MarkdownDisplay markdown={stream.tokens} />
						</p>
					</div>
				</>
			)}

			<Button
				className={cn(
					'pointer-events-none fixed right-26 bottom-38 opacity-0 transition-opacity duration-300',
					{
						'pointer-events-auto opacity-100': showScrollButton,
					},
				)}
				onClick={scrollToBottom}
				variant="outline"
			>
				Scroll to Bottom
				<ArrowDownIcon className="ml-2 h-4 w-4" />
			</Button>
		</div>
	);
};

const AnimatedDots = () => {
	const [dots, setDots] = useState('.');

	useEffect(() => {
		const interval = setInterval(() => {
			setDots((prev) => {
				if (prev === ' ') return '.';
				if (prev === '.') return '..';
				if (prev === '..') return '...';
				return ' ';
			});
		}, 500);

		return () => clearInterval(interval);
	}, []);

	return <span className="absolute -top-0.5 left-4 animate-pulse">{dots}</span>;
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
				{message.type === 'agent' ? (
					<MarkdownDisplay markdown={message.content} />
				) : (
					<p className="whitespace-pre-wrap">{message.content}</p>
				)}
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
