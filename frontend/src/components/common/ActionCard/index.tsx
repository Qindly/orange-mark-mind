import './ActionCard.scss';

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
}

function ActionCard({ icon, title, description, onClick }: ActionCardProps) {
  return (
    <div className="action-card" onClick={onClick}>
      <span className="action-card__icon">{icon}</span>
      <div className="action-card__content">
        <h3 className="action-card__title">{title}</h3>
        <p className="action-card__desc">{description}</p>
      </div>
    </div>
  );
}

export default ActionCard;
