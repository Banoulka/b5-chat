import type { API_ThreadMessagesResponse } from '@b5-chat/common';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { api } from '../auth/AuthContext';

type Props = {
	bottomRefHeight: number;
	threadId: string;
};

const SCROLL_THRESHOLD = 50;

const MessageList = ({ bottomRefHeight, threadId }: Props) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [hasFirstPageLoaded, setHasFirstPageLoaded] = useState(false);

	const { data, isFetching, isFetchPreviousPageError, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery<API_ThreadMessagesResponse>({
			getNextPageParam: (lastPage) => lastPage?.meta?.nextCursor,
			initialPageParam: undefined,
			placeholderData: keepPreviousData,
			queryFn: ({ pageParam }) =>
				api<API_ThreadMessagesResponse>(
					pageParam ? `/threads/${threadId}/messages?from=${pageParam}` : `/threads/${threadId}/messages`,
				),
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
		if (hasFirstPageLoaded || isFetching) return;

		scrollToBottom();
		setHasFirstPageLoaded(true);
	}, [hasFirstPageLoaded, isFetching]);

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
			{flatPages?.map((message) => (
				<div
					className={cn('m-2 flex flex-col p-2', {
						'bg-blue-200 text-left': message.type === 'user',
						'bg-green-200 text-center': message.type === 'agent',
					})}
					key={message.id}
				>
					{message.content}
				</div>
			))}
		</div>
	);
};

export default MessageList;
