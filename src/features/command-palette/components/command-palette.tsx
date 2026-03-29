import { useEffect, useMemo, useRef, useState } from "react";

import type { CommandItem } from "../types/command";
import { scoreCommandMatch } from "../lib/match";

type CommandPaletteProps = {
  isOpen: boolean;
  commands: CommandItem[];
  onClose: () => void;
  onRestoreFocus?: () => void;
};

function clampIndex(value: number, maxExclusive: number): number {
  if (maxExclusive <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(value, maxExclusive - 1));
}

export function CommandPalette({ isOpen, commands, onClose, onRestoreFocus }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const scored = commands
      .map((command) => {
        const match = scoreCommandMatch(query, command.title, command.subtitle);
        if (!match) {
          return null;
        }
        return { command, match };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    scored.sort((a, b) => {
      if (b.match.score !== a.match.score) {
        return b.match.score - a.match.score;
      }
      if (a.match.tieBreaker !== b.match.tieBreaker) {
        return a.match.tieBreaker - b.match.tieBreaker;
      }
      return a.command.title.localeCompare(b.command.title);
    });

    return scored.map((item) => item.command).slice(0, 50);
  }, [commands, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setQuery("");
    setActiveIndex(0);
    queueMicrotask(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex((current) => clampIndex(current, results.length));
  }, [results.length]);

  useEffect(() => {
    if (isOpen) {
      return;
    }
    onRestoreFocus?.();
  }, [isOpen, onRestoreFocus]);

  const executeActive = () => {
    const selected = results[activeIndex];
    if (!selected) {
      return;
    }
    selected.handler();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          return;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActiveIndex((current) => clampIndex(current + 1, results.length));
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setActiveIndex((current) => clampIndex(current - 1, results.length));
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          executeActive();
        }
      }}
    >
      <div className="w-full max-w-2xl rounded-lg border border-glass-border ui-glass ui-elevation-1">
        <div className="border-b border-glass-border px-3 py-2">
          <label className="sr-only" htmlFor="command-palette-input">
            Command palette search
          </label>
          <input
            ref={inputRef}
            id="command-palette-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command, repository, branch, or commit…"
            className="w-full rounded-md border border-subtle bg-panel px-3 py-2 text-sm text-primary outline-none transition focus:border-accent"
          />
        </div>

        <ul
          role="listbox"
          aria-label="Command results"
          className="max-h-[420px] overflow-auto p-2"
        >
          {results.length === 0 ? (
            <li className="rounded-md border border-dashed border-subtle bg-base/50 px-3 py-3 text-sm text-muted">
              No matches.
            </li>
          ) : (
            results.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={item.id} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => {
                      item.handler();
                      onClose();
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors duration-150 ${
                      isActive
                        ? "border-accent-border bg-accent-bg text-primary"
                        : "border-subtle bg-elevated text-secondary hover:border-strong hover:bg-panel hover:text-primary"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{item.title}</div>
                      {item.subtitle ? (
                        <div className="mt-0.5 truncate text-[11px] text-muted">{item.subtitle}</div>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {item.category}
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="border-t border-glass-border px-3 py-2 text-[11px] text-muted">
          <span className="font-medium text-secondary">↑</span>/<span className="font-medium text-secondary">↓</span>{" "}
          to navigate, <span className="font-medium text-secondary">Enter</span> to run,{" "}
          <span className="font-medium text-secondary">Esc</span> to close
        </div>
      </div>
    </div>
  );
}

