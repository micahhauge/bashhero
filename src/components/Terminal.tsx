"use client";

import { useEffect, useRef, useState } from "react";
import { pathToString, type Path } from "@/lib/filesystem";

export type HistoryEntry = {
  id: string;
  cwdAtPrompt: Path;
  command: string;
  output: string[];
  isError?: boolean;
};

function Prompt({ cwd }: { cwd: Path }) {
  return (
    <span className="text-emerald-400">
      {pathToString(cwd)} <span className="text-zinc-500">$</span>
    </span>
  );
}

export function Terminal({
  cwd,
  history,
  onSubmit,
}: {
  cwd: Path;
  history: HistoryEntry[];
  onSubmit: (raw: string) => void;
}) {
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pastCommands = history.filter((h) => h.command).map((h) => h.command);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      onSubmit(input);
      setInput("");
      setHistoryIndex(null);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (pastCommands.length === 0) return;
      const nextIndex =
        historyIndex === null
          ? pastCommands.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(pastCommands[nextIndex]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= pastCommands.length) {
        setHistoryIndex(null);
        setInput("");
      } else {
        setHistoryIndex(nextIndex);
        setInput(pastCommands[nextIndex]);
      }
    }
  }

  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        <span className="ml-2 text-xs text-zinc-500">bash</span>
      </div>

      <div
        ref={scrollRef}
        className="h-72 overflow-y-auto px-4 py-3 font-mono text-sm leading-relaxed sm:text-[15px]"
      >
        {history.map((entry) => (
          <div key={entry.id} className="mb-1">
            {entry.command && (
              <div>
                <Prompt cwd={entry.cwdAtPrompt} />{" "}
                <span className="text-zinc-100">{entry.command}</span>
              </div>
            )}
            {entry.output.map((line, i) => (
              <div
                key={i}
                className={entry.isError ? "text-red-400" : "text-zinc-400"}
              >
                {line}
              </div>
            ))}
          </div>
        ))}

        <div className="flex items-center">
          <Prompt cwd={cwd} />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="ml-2 flex-1 bg-transparent text-zinc-100 outline-none"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
