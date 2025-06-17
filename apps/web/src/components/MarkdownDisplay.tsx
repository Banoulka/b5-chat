import { CopyIcon } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow as theme } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

import { Button } from './ui/button';

const CopyButton = ({ icon, children, text }: { icon: React.ReactNode; children: React.ReactNode; text: string }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 10000);
	};

	return (
		<Button size="sm" variant="ghost" onClick={handleCopy}>
			{copied ? 'Copied' : children}
			{icon}
		</Button>
	);
};

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
						const { children, className, ref, node, ...rest } = props;
						const match = /language-(\w+)/.exec(className || '');

						return match ? (
							<div className="relative">
								<div className="bg-secondary relative top-2 flex w-full items-center p-2">
									<code className="m-0 text-white">{match[1]}</code>
									<div className="ml-auto font-sans">
										<CopyButton
											text={String(children).replace(/\n$/, '')}
											icon={<CopyIcon className="h-4 w-4" />}
										>
											Copy
										</CopyButton>
									</div>
								</div>
								<SyntaxHighlighter
									{...rest}
									PreTag="div"
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									ref={ref as any}
									children={String(children).replace(/\n$/, '')}
									language={match[1]}
									style={theme}
								/>
							</div>
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
