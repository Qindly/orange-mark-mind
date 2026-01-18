import './DocumentItem.scss';

interface DocumentItemProps {
  id: number;
  title: string;
  folderName?: string;
  date: string;
  icon?: string;
  onClick?: () => void;
}

function DocumentItem({ id, title, folderName, date, icon = '📄', onClick }: DocumentItemProps) {
  return (
    <div className="document-item" onClick={onClick}>
      <div className="document-item__icon">
        <span>{icon}</span>
      </div>
      <div className="document-item__content">
        <h4 className="document-item__title">{title}</h4>
        <span className="document-item__folder">{folderName || '未分类'}</span>
      </div>
      <span className="document-item__date">{date}</span>
    </div>
  );
}

export default DocumentItem;
