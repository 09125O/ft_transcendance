import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export default function Panel({ children, className = "" }: PanelProps) {
  return (
    <div
      className={`flex flex-col rounded-[26px] border border-white/10 bg-surface/95 shadow-[0_32px_90px_-56px_rgba(11,18,32,0.95)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}
