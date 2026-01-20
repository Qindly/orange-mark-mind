import type { ReactNode, MouseEvent } from 'react';
import './DocumentItem.scss';

export interface DocumentAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: (id: string) => void;
  danger?: boolean;
}

interface DocumentItemProps {
  id: string;
  title: string;
  folderName?: string;
  date: string;
  onClick?: () => void;
  actions?: DocumentAction[];
}

function DocumentItem({ id, title, folderName, date, onClick, actions }: DocumentItemProps) {
  const handleActionClick = (e: MouseEvent, action: DocumentAction) => {
    e.stopPropagation();
    action.onClick(id);
  };

  return (
    <div className="document-item" onClick={onClick}>
      <div className="document-item__content">
        <h4 className="document-item__title">{title}</h4>
        <span className="document-item__folder">{folderName || '未分类'}</span>
      </div>
      <span className="document-item__date">{date}</span>
      {actions && actions.length > 0 && (
        <div className="document-item__actions">
          {actions.map(action => (
            <button
              key={action.key}
              className={`document-item__action ${action.danger ? 'document-item__action--danger' : ''}`}
              onClick={(e) => handleActionClick(e, action)}
              title={action.label}
            >
              {action.icon || action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentItem;
