type MessageInputProps = {
	threadId?: string;
	ref?: React.RefObject<HTMLDivElement>;
};

const MessageInput = ({ threadId }: MessageInputProps) => {
	return (
		<>
			<p>MessageInput - {threadId ?? 'no thread id'}</p>
			<p>MessageInput</p>
			<p>MessageInput</p>
			<input />
			<button>Send</button>
		</>
	);
};

export default MessageInput;
