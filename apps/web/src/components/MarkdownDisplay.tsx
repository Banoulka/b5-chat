import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownDisplay = ({ markdown }: { markdown: string }) => {
	return (
		<div className="markdown-components contents">
			<ReactMarkdown
				unwrapDisallowed
				skipHtml
				remarkPlugins={[remarkGfm]}
				children={markdown.replace('\\n', '\n')}
			/>
		</div>
	);
};

export default MarkdownDisplay;
