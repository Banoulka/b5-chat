import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const test = `A paragraph with *emphasis* and **strong importance**.

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

* Lists
* [ ] todo
* [x] done

# Test title

## Test subtitle

### Another subtitle

A table:

| a | b |
| --- | --- |
| 123 | 123 |

`;

console.log('test', test);

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
