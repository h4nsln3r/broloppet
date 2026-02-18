import "./card.scss";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div className={className ? `card ${className}` : "card"}>{children}</div>
  );
}
