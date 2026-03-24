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
        "group/tab relative flex h-7 max-w-[200px] shrink-0 items-stretch rounded border text-left transition-[background-color,border-color,box-shadow,color] duration-100",
        isActive
          ? "z-[1] border-zinc-400/55 bg-zinc-800 text-zinc-50 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.12),inset_0_-1px_0_0_rgba(0,0,0,0.35)] hover:border-zinc-400/70"
          : "border-zinc-800/80 bg-zinc-900/50 text-zinc-500 hover:border-zinc-600/50 hover:bg-zinc-800/40 hover:text-zinc-300",
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
        className="flex min-w-0 flex-1 items-center gap-1 rounded-l border-r border-transparent px-2 py-0 text-left outline-none select-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-zinc-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-tight tracking-tight">
          {tab.name}
        </span>
        {branchLabel ? (
          <span
            className={[
              "max-w-[68px] shrink-0 truncate rounded px-1 py-0.5 font-mono text-[9px] font-normal leading-none",
              isActive
                ? "bg-zinc-950/50 text-zinc-400"
                : "bg-zinc-950/30 text-zinc-600 group-hover/tab:text-zinc-500",
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
          "flex h-full min-w-[26px] shrink-0 items-center justify-center rounded-r border-l text-sm leading-none outline-none transition-[opacity,background-color,color] duration-100",
          isActive ? "border-zinc-600/50 text-zinc-400" : "border-zinc-700/50 text-zinc-600",
          "opacity-70 group-hover/tab:opacity-100 group-focus-within/tab:opacity-100",
          "hover:bg-red-950/50 hover:text-red-200 hover:opacity-100",
          "focus-visible:z-10 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500/80",
        ].join(" ")}
      >
        <span aria-hidden className="-mt-px block text-base font-light">
          ×
        </span>
      </button>
    </div>
  );
});
