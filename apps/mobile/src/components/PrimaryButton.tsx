import type { ReactNode } from "react";

type PrimaryButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
};

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = ""
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={`primary-button ${variant} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
