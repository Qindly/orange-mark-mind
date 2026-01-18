import './PageHeader.scss';

interface PageHeaderProps {
  title: string;
  icon?: string;
  actions?: React.ReactNode;
}

function PageHeader({ title, icon, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__left">
        {icon && <span className="page-header__icon">{icon}</span>}
        <h1 className="page-header__title">{title}</h1>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}

export default PageHeader;
