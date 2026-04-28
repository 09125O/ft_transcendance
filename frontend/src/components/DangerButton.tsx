import type { ButtonHTMLAttributes, ReactNode } from "react";

type DangerButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function DangerButton({
  children,
  className = "",
  type = "button",
  ...props
}: DangerButtonProps) {
  return (
    <button
      className={`transform-gpu rounded-full border-2 border-[color:color-mix(in_srgb,var(--color-danger)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--color-danger)_14%,var(--color-background))] font-semibold text-[var(--color-text)] transition duration-200 hover:scale-105 hover:border-[color:color-mix(in_srgb,var(--color-danger)_75%,var(--color-text))] hover:bg-[color:color-mix(in_srgb,var(--color-danger)_24%,var(--color-background))] hover:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-danger)_55%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none disabled:scale-100 disabled:opacity-60 ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
