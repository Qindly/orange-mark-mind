import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import mermaid from 'mermaid';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import './MarkdownRenderer.scss';

// 初始化 mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
});

interface MarkdownRendererProps {
    content: string;
}

// Mermaid 图表组件
function MermaidDiagram({ code }: { code: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const renderDiagram = async () => {
            if (!code.trim()) return;

            try {
                const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
                const { svg } = await mermaid.render(id, code);
                setSvg(svg);
                setError('');
            } catch (err) {
                console.error('Mermaid rendering error:', err);
                setError('图表渲染失败');
            }
        };

        renderDiagram();
    }, [code]);

    if (error) {
        return (
            <div className="mermaid-error">
                <span>{error}</span>
                <pre>{code}</pre>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="mermaid-diagram"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

// 自定义代码块组件
function CustomCode({ className, children, ...props }: ComponentPropsWithoutRef<'code'>) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeString = String(children).replace(/\n$/, '');

    // 如果是 mermaid 代码块，使用 MermaidDiagram 渲染
    if (language === 'mermaid') {
        return <MermaidDiagram code={codeString} />;
    }

    // 否则使用默认渲染（已由 rehype-highlight 处理）
    return (
        <code className={className} {...props}>
            {children}
        </code>
    );
}

function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="markdown-renderer">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeSlug, rehypeHighlight, rehypeKatex]}
                components={{
                    code: CustomCode,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

export default MarkdownRenderer;
