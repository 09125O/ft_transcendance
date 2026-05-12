import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-text/10 bg-surface/95 shadow-[0_36px_100px_-60px_color-mix(in_srgb,var(--color-background)_95%,transparent)] backdrop-blur-sm sm:max-w-2xl ${className}`}
    >
      {children}
    </div>
  );
}
