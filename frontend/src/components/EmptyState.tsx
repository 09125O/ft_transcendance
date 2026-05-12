import type { ReactNode } from "react";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  fill?: boolean;
};

export default function EmptyState({
  title,
  description,
  className = "",
  fill = false,
}: EmptyStateProps) {
  return (
    <div
      className={`px-5 py-6 text-center ${fill ? "flex min-h-48 flex-1 flex-col items-center justify-center" : ""} ${className}`}
    >
      <p className="m-0 text-base font-semibold text-text">{title}</p>
      {description ? (
        <p className="text-text-muted m-0 mt-2 text-sm">{description}</p>
      ) : null}
    </div>
  );
}
