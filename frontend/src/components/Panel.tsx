import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export default function Panel({ children, className = "" }: PanelProps) {
  return (
    <div
      className={`flex flex-col rounded-3xl border border-primary/20 bg-surface/88 shadow-[0_36px_84px_-48px_color-mix(in_srgb,var(--color-background)_96%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-text-muted)_22%,transparent)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
