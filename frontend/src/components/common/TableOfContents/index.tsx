import { useMemo } from 'react';
import './TableOfContents.scss';

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    content: string;
}

// 从 markdown 内容中提取标题
function extractHeadings(content: string): TocItem[] {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const headings: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        // 生成 id：转小写、替换空格为短横线、移除特殊字符
        const id = text
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u4e00-\u9fa5-]/g, '');

        headings.push({ id, text, level });
    }

    return headings;
}

function TableOfContents({ content }: TableOfContentsProps) {
    const headings = useMemo(() => extractHeadings(content), [content]);

    if (headings.length === 0) {
        return null;
    }

    const handleClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <nav className="table-of-contents">
            <h4 className="table-of-contents__title">目录</h4>
            <ul className="table-of-contents__list">
                {headings.map((heading, index) => (
                    <li
                        key={`${heading.id}-${index}`}
                        className={`table-of-contents__item table-of-contents__item--level-${heading.level}`}
                    >
                        <button
                            className="table-of-contents__link"
                            onClick={() => handleClick(heading.id)}
                        >
                            {heading.text}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default TableOfContents;
