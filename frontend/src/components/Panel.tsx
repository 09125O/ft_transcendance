import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export default function Panel({ children, className = "" }: PanelProps) {
  return (
    <div
      className={`flex flex-col rounded-[26px] border border-primary/20 bg-surface/88 shadow-[0_36px_84px_-48px_rgba(5,9,20,0.96),inset_0_1px_0_rgba(148,163,184,0.22)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
