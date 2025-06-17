import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow as theme } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const MarkdownDisplay = ({ markdown }: { markdown: string }) => {
	return (
		<div className="markdown-components contents">
			<ReactMarkdown
				unwrapDisallowed
				skipHtml
				remarkPlugins={[remarkGfm]}
				children={markdown.replace('\\n', '\n')}
				components={{
					code(props) {
						const { children, className, ref, ...rest } = props;
						const match = /language-(\w+)/.exec(className || '');
						return match ? (
							<SyntaxHighlighter
								{...rest}
								PreTag="div"
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								ref={ref as any}
								children={String(children).replace(/\n$/, '')}
								language={match[1]}
								style={theme}
							/>
						) : (
							<code {...rest} className={className}>
								{children}
							</code>
						);
					},
				}}
			/>
		</div>
	);
};

export default MarkdownDisplay;
