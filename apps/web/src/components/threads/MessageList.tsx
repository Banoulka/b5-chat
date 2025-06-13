import type { API_ThreadMessagesResponse } from '@b5-chat/common';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { cn } from '@/lib/utils';

import { api } from '../auth/AuthContext';
import { Skeleton } from '../ui/skeleton';

type Props = {
	bottomRefHeight: number;
	threadId: string;
};

type LocalMessage = {
	type: 'local';
	localId: string;
	content: string;
};

type MessageData = API_ThreadMessagesResponse['data'][number] | LocalMessage;

const SCROLL_THRESHOLD = 50;

const MessageList = ({ bottomRefHeight, threadId }: Props) => {
	const scrollRef = useRef<HTMLDivElement>(null);

	const { data, isFetching, isFetchPreviousPageError, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery<Omit<API_ThreadMessagesResponse, 'data'> & { data: MessageData[] }>({
			getNextPageParam: (lastPage) => lastPage?.meta?.nextCursor,
			initialPageParam: undefined,
			placeholderData: keepPreviousData,
			queryFn: ({ pageParam }) =>
				api(pageParam ? `/threads/${threadId}/messages?from=${pageParam}` : `/threads/${threadId}/messages`),
			queryKey: ['messages', threadId],
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
			className="flex h-full w-full flex-col overflow-y-auto bg-green-50 pb-4"
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
						<Skeleton className={cn('m-2 flex flex-col rounded bg-gray-200 p-4')} key={index} />
					))}
			{flatPages?.map((message) => (
				<MessageDisplay message={message} key={message.type === 'local' ? message.localId : message.id} />
			))}
		</div>
	);
};

const MessageDisplay = ({ message }: { message: MessageData }) => {
	return (
		<div
			className="m-2 mx-auto flex w-[70%] flex-col items-end"
			key={message.type === 'local' ? message.localId : message.id}
		>
			<p
				className={cn('rounded p-2', {
					'w-fit max-w-[70%] bg-blue-200': message.type === 'user',
					'w-full bg-green-200': message.type === 'agent',
				})}
			>
				{message.content}
			</p>
		</div>
	);
};

export default MessageList;
