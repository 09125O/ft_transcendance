import type { ButtonHTMLAttributes, ReactNode } from "react";

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export const secondaryButtonClassName =
  "transform-gpu rounded-full border-2 border-primary/35 bg-[color:color-mix(in_srgb,var(--color-background)_92%,transparent)] font-semibold text-text transition duration-200 hover:scale-105 hover:border-text hover:bg-primary-hover hover:text-[var(--color-text)] hover:shadow-[0_0_0_2px_var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none disabled:scale-100 disabled:opacity-60";

export default function SecondaryButton({
  children,
  className = "",
  type = "button",
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      className={`${secondaryButtonClassName} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
