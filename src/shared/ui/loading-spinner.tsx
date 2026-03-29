export type LoadingSpinnerVariant =
  | "panel"
  | "branch"
  | "workspace"
  | "diffContent"
  | "violet"
  | "commit";

const VARIANT_CLASSES: Record<LoadingSpinnerVariant, string> = {
  panel: "h-3.5 w-3.5 border-2 border-subtle border-t-primary",
  branch: "h-2.5 w-2.5 border border-subtle border-t-transparent",
  workspace: "h-4 w-4 border-2 border-subtle border-t-primary",
  diffContent: "h-3 w-3 border-2 border-subtle border-t-primary",
  violet: "h-3.5 w-3.5 border-2 border-ai-border border-t-transparent",
  commit: "h-3.5 w-3.5 border-2 border-subtle border-t-panel",
};

type LoadingSpinnerProps = {
  variant: LoadingSpinnerVariant;
  className?: string;
};

export function LoadingSpinner({ variant, className = "" }: LoadingSpinnerProps) {
  const sizeClass = VARIANT_CLASSES[variant];
  return (
    <span
      aria-hidden
      className={`shrink-0 animate-spin rounded-full ${sizeClass} ${className}`.trim()}
    />
  );
}
