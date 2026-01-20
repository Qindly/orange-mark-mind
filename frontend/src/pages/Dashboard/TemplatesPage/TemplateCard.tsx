import type { Template } from '@/types/template';
import './TemplateCard.scss';

interface TemplateCardProps {
    template: Template;
    onClick: () => void;
}

// 图标映射
const iconMap: Record<string, string> = {
    blank: '📄',
    meeting: '📋',
    tech: '⚙️',
    book: '📖',
    project: '📊',
    report: '📝',
    debug: '🐛',
    api: '🔗',
    review: '🔄',
    document: '📃',
};

function TemplateCard({ template, onClick }: TemplateCardProps) {
    const icon = iconMap[template.icon] || '📃';

    return (
        <div
            className={`template-card ${template.is_system ? 'template-card--system' : 'template-card--user'}`}
            onClick={onClick}
        >
            <div className="template-card__icon">{icon}</div>
            <div className="template-card__info">
                <h3 className="template-card__name">{template.name}</h3>
                {template.description && (
                    <p className="template-card__description">{template.description}</p>
                )}
            </div>
            {template.is_system && (
                <span className="template-card__badge">系统</span>
            )}
        </div>
    );
}

export default TemplateCard;
