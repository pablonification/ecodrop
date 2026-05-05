import type { ReactNode } from "react";

type StatusCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
  children?: ReactNode;
};

export function StatusCard({
  eyebrow,
  title,
  description,
  icon,
  tone = "neutral",
  children
}: StatusCardProps) {
  return (
    <section className={`status-card ${tone}`}>
      {icon && <div className="status-icon">{icon}</div>}
      {eyebrow && <span className="card-eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
    </section>
  );
}
