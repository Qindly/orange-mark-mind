import './ActionCard.scss';

interface ActionCardProps {
  title: string;
  description: string;
  onClick?: () => void;
}

function ActionCard({ title, description, onClick }: ActionCardProps) {
  return (
    <div className="action-card" onClick={onClick}>
      <div className="action-card__content">
        <h3 className="action-card__title">{title}</h3>
        <p className="action-card__desc">{description}</p>
      </div>
    </div>
  );
}

export default ActionCard;
