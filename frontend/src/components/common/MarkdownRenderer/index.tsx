import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import './MarkdownRenderer.scss';

interface MarkdownRendererProps {
    content: string;
}

function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="markdown-renderer">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

export default MarkdownRenderer;
