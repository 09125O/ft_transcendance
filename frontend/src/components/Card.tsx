import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`flex w-full max-w-xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-surface/95 shadow-[0_36px_100px_-60px_rgba(11,18,32,0.95)] backdrop-blur-sm sm:max-w-2xl ${className}`}
    >
      {children}
    </div>
  );
}
