import type { API_ThreadMessagesResponse } from '@b5-chat/common';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { getMessageOpts } from '@/hooks/queries';
import { useStream } from '@/hooks/use-stream';
import { cn } from '@/lib/utils';

import { api } from '../auth/AuthContext';
import MarkdownDisplay from '../MarkdownDisplay';
import { Skeleton } from '../ui/skeleton';

type Props = {
	bottomRefHeight: number;
	threadId: string;
	stream: ReturnType<typeof useStream>;
};

export type LocalMessage = {
	type: 'local';
	localId: string;
	content: string;
};

export type QueryTypeMessageData = Omit<API_ThreadMessagesResponse, 'data'> & { data: MessageData[] };

type MessageData = API_ThreadMessagesResponse['data'][number] | LocalMessage;

const SCROLL_THRESHOLD = 50;

const MessageList = ({ bottomRefHeight, threadId, stream }: Props) => {
	const scrollRef = useRef<HTMLDivElement>(null);

	const { data, isFetching, isFetchPreviousPageError, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery<QueryTypeMessageData>({
			getNextPageParam: (lastPage) => lastPage?.meta?.nextCursor,
			initialPageParam: undefined,
			placeholderData: keepPreviousData,
			queryFn: ({ pageParam }) =>
				api(pageParam ? `/threads/${threadId}/messages?from=${pageParam}` : `/threads/${threadId}/messages`),
			...getMessageOpts(threadId),
		});

	const flatPages = useMemo(() => {
		if (!data) return [];
		return [...data.pages].reverse().flatMap((page) => [...page.data].reverse());
	}, [data]);

	const scrollToBottom = () => {
		if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	};

	useEffect(() => {
		// console.log('hasFirstPageLoaded', hasFirstPageLoaded, isFetching);
		// if (hasFirstPageLoaded || isFetching) return;
		console.log('scrollToBottom');
		scrollToBottom();
		// setHasFirstPageLoaded(true);
	}, [scrollRef.current]);

	return (
		<div
			style={{ height: `calc(100vh - ${bottomRefHeight}px)` }}
			className="bg-secondary dark:bg-background flex h-full w-full flex-col overflow-y-auto pb-4"
			ref={scrollRef}
			onScroll={(e) => {
				const scrollTop = (e.target as HTMLDivElement).scrollTop;
				const isAtTop = scrollTop < SCROLL_THRESHOLD;

				console.log('isAtTop', isAtTop, hasNextPage, isFetchingNextPage);
				if (isAtTop && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			}}
		>
			{isFetchPreviousPageError && <div>Error</div>}
			{isFetching &&
				new Array(10)
					.fill(0)
					.map((_, index) => (
						<Skeleton
							className={cn('bg-muted dark:bg-muted/40 m-2 flex flex-col rounded p-4')}
							key={index}
						/>
					))}
			{flatPages?.map((message) => (
				<MessageDisplay message={message} key={message.type === 'local' ? message.localId : message.id} />
			))}
			{stream.isStreaming && (
				<div className="m-2 mx-auto flex w-[70%] flex-col items-end">
					<p className={cn('w-full rounded bg-green-200 p-2')}>{stream.tokens}</p>
				</div>
			)}
		</div>
	);
};

const MessageDisplay = ({ message }: { message: MessageData }) => {
	return (
		<div
			className="m-2 mx-auto flex w-[70%] flex-col items-end"
			key={message.type === 'local' ? message.localId : message.id}
		>
			<div
				className={cn(
					'rounded-2xl p-2',
					message.type === 'user'
						? 'bg-secondary w-fit max-w-[70%] dark:text-blue-50'
						: 'w-full bg-transparent dark:text-green-50',
				)}
			>
				{message.type === 'agent' ? <MarkdownDisplay markdown={message.content} /> : <p>{message.content}</p>}
			</div>
		</div>
	);
};

export default MessageList;
