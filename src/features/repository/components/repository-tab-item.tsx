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

  const handleCloseMouseDown = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

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
        "group/tab relative flex h-7 max-w-[200px] shrink-0 items-stretch rounded-md border text-left transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-out",
        isActive
          ? "z-1 border-strong bg-panel text-primary ui-elevation-1 hover:border-strong"
          : "border-subtle bg-elevated text-muted hover:border-strong hover:bg-panel hover:text-secondary",
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
        className="flex min-w-0 flex-1 items-center gap-1 rounded-l-md border-r border-transparent px-2 py-0 text-left outline-none select-none transition-colors duration-150 ease-out focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-accent/80 focus-visible:ring-offset-2 focus-visible:ring-offset-base active:scale-[0.98]"
      >
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-tight tracking-tight">
          {tab.name}
        </span>
        {branchLabel ? (
          <span
            className={[
              "max-w-[68px] shrink-0 truncate rounded px-1 py-0.5 font-mono text-[9px] font-normal leading-none",
              isActive
                ? "bg-elevated text-secondary"
                : "bg-elevated text-disabled group-hover/tab:text-muted",
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
        onMouseDown={(event) => {
          handleCloseMouseDown(event);
          handleMiddleClose(event);
        }}
        className={[
          "flex h-full min-w-[26px] shrink-0 items-center justify-center rounded-r-md border-l text-sm leading-none outline-none transition-[opacity,background-color,color,transform] duration-150 ease-out",
          isActive ? "border-subtle text-secondary" : "border-subtle text-disabled",
          "opacity-60 group-hover/tab:opacity-100 group-focus-within/tab:opacity-100",
          "hover:bg-danger-bg hover:text-danger-fg hover:opacity-100 active:scale-[0.98]",
          "focus-visible:z-10 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/80",
        ].join(" ")}
      >
        <span aria-hidden className="-mt-px block text-base font-light">
          ×
        </span>
      </button>
    </div>
  );
});
