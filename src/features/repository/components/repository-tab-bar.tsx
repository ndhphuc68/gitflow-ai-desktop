import { memo, useCallback, useEffect, useRef } from "react";

import type { RepositoryTab } from "../../../store/workspace-store";

import { RepositoryTabItem } from "./repository-tab-item";

type RepositoryTabBarProps = {
  tabs: RepositoryTab[];
  activeRepositoryId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
};

export const RepositoryTabBar = memo(function RepositoryTabBar({
  tabs,
  activeRepositoryId,
  onSelectTab,
  onCloseTab,
}: RepositoryTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const onArrowNavigate = useCallback(
    (fromIndex: number, delta: -1 | 1) => {
      const nextIndex = fromIndex + delta;
      if (nextIndex < 0 || nextIndex >= tabs.length) {
        return;
      }
      const nextTab = tabs[nextIndex];
      if (!nextTab) {
        return;
      }
      onSelectTab(nextTab.id);
      queueMicrotask(() => {
        document.getElementById(`workspace-repository-tab-${nextIndex}`)?.focus();
      });
    },
    [tabs, onSelectTab]
  );

  useEffect(() => {
    if (!activeRepositoryId) {
      return;
    }
    const activeRoot = scrollRef.current?.querySelector(
      '[data-tab-root][data-state="active"]'
    );
    activeRoot?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "auto",
    });
  }, [activeRepositoryId, tabs]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      ref={scrollRef}
      className="flex min-h-9 min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto overflow-y-hidden scroll-smooth bg-zinc-950/80 px-1 py-0.5 [scrollbar-color:rgba(82,82,91,0.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600/50 [&::-webkit-scrollbar-track]:bg-transparent"
      role="tablist"
      aria-label="Open repositories"
      aria-orientation="horizontal"
    >
      {tabs.map((tab, tabIndex) => (
        <RepositoryTabItem
          key={tab.id}
          tab={tab}
          tabIndex={tabIndex}
          isActive={tab.id === activeRepositoryId}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
          onArrowNavigate={onArrowNavigate}
        />
      ))}
    </div>
  );
});
