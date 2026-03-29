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
      className="flex min-h-10 min-w-0 flex-1 items-stretch gap-1 overflow-x-auto overflow-y-hidden rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[rgba(11,18,32,0.38)] px-1 py-1 scroll-smooth"
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
