import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function PrimaryButton({
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`transform-gpu rounded-full border-2 border-transparent bg-primary font-semibold text-[var(--color-text)] shadow-[0_24px_42px_-26px_color-mix(in_srgb,var(--color-primary)_90%,transparent)] transition duration-200 hover:scale-110 hover:border-text hover:bg-primary-hover hover:shadow-[0_0_0_2px_var(--color-primary),0_26px_48px_-26px_color-mix(in_srgb,var(--color-primary)_95%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none disabled:scale-100 disabled:border-transparent disabled:opacity-60 ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
