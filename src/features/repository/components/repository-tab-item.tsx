import {
  memo,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import type { RepositoryTab } from "../../../store/workspace-store";

export type RepositoryTabItemProps = {
  tab: RepositoryTab;
  tabIndex: number;
  isActive: boolean;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onArrowNavigate: (fromIndex: number, delta: -1 | 1) => void;
};

export const RepositoryTabItem = memo(function RepositoryTabItem({
  tab,
  tabIndex,
  isActive,
  onSelectTab,
  onCloseTab,
  onArrowNavigate,
}: RepositoryTabItemProps) {
  const branchLabel = tab.currentBranch?.trim() ? tab.currentBranch : undefined;

  const handleSelect = useCallback(() => {
    onSelectTab(tab.id);
  }, [onSelectTab, tab.id]);

  const handleClose = useCallback(() => {
    onCloseTab(tab.id);
  }, [onCloseTab, tab.id]);

  const handleMiddleClose = useCallback(
    (event: MouseEvent) => {
      if (event.button !== 1) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onCloseTab(tab.id);
    },
    [onCloseTab, tab.id]
  );

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onArrowNavigate(tabIndex, 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onArrowNavigate(tabIndex, -1);
      }
    },
    [onArrowNavigate, tabIndex]
  );

  return (
    <div
      role="presentation"
      data-tab-root=""
      data-state={isActive ? "active" : "inactive"}
      className={[
        "group/tab relative flex h-8 max-w-[220px] shrink-0 items-stretch rounded-[var(--radius-md)] border text-left transition-[background-color,border-color,box-shadow,color] duration-100",
        isActive
          ? "z-[1] border-[var(--color-primary)]/60 bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-surface))] text-[var(--color-text)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-primary)_22%,transparent),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[var(--color-primary)]"
          : "border-[var(--color-divider)] bg-[rgba(17,24,39,0.42)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[rgba(39,52,73,0.68)] hover:text-[var(--color-text)]",
      ].join(" ")}
    >
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        id={`workspace-repository-tab-${tabIndex}`}
        onClick={handleSelect}
        onMouseDown={handleMiddleClose}
        onKeyDown={handleTabKeyDown}
        className="flex min-w-0 flex-1 items-center gap-1 rounded-l-[inherit] border-r border-transparent px-2.5 py-0 text-left outline-none select-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
      >
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-tight tracking-tight">
          {tab.name}
        </span>
        {branchLabel ? (
          <span
            className={[
              "max-w-[68px] shrink-0 truncate rounded-full px-1.5 py-0.5 font-mono text-[9px] font-normal leading-none",
              isActive
                ? "bg-[rgba(11,18,32,0.72)] text-[var(--color-primary-soft)]"
                : "bg-[rgba(11,18,32,0.58)] text-[var(--color-text-muted)] group-hover/tab:text-[var(--color-text-secondary)]",
            ].join(" ")}
            title={branchLabel}
          >
            {branchLabel}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        title={`Close ${tab.name}`}
        aria-label={`Close repository tab ${tab.name}`}
        tabIndex={-1}
        onClick={handleClose}
        onMouseDown={handleMiddleClose}
        className={[
          "flex h-full min-w-[28px] shrink-0 items-center justify-center rounded-r-[inherit] border-l text-sm leading-none outline-none transition-[opacity,background-color,color] duration-100",
          isActive ? "border-[var(--color-divider)] text-[var(--color-text-secondary)]" : "border-[var(--color-divider)] text-[var(--color-text-muted)]",
          "opacity-70 group-hover/tab:opacity-100 group-focus-within/tab:opacity-100",
          "hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-text)] hover:opacity-100",
          "focus-visible:z-10 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary-ring)]",
        ].join(" ")}
      >
        <span aria-hidden className="-mt-px block text-base font-light">
          x
        </span>
      </button>
    </div>
  );
});


