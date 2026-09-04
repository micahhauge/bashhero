"use client";

import { useCallback, useRef, useState } from "react";
import { Terminal, type HistoryEntry } from "./Terminal";
import { DirectoryGraph } from "./DirectoryGraph";
import { FileTree } from "./FileTree";
import { ROOT_NAME, pathToString, resolveCd, type Path } from "@/lib/filesystem";

type View = "tree" | "graph" | "both";

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: "tree", label: "Tree" },
  { value: "graph", label: "Graph" },
  { value: "both", label: "Both" },
];

const INITIAL_HISTORY: HistoryEntry[] = [
  {
    id: "welcome",
    cwdAtPrompt: [ROOT_NAME],
    command: "",
    output: [
      "Welcome to BashHero.",
      "Try `cd projects` to move into a directory, and `cd ..` to move back up.",
      "`cd -` jumps back to wherever you just came from.",
      "You can also click a directory to jump there.",
    ],
  },
];

export function Playground() {
  const [cwd, setCwd] = useState<Path>([ROOT_NAME]);
  const [previousCwd, setPreviousCwd] = useState<Path | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(INITIAL_HISTORY);
  const [view, setView] = useState<View>("both");
  const idCounter = useRef(0);

  const runCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === "") return;

      const [cmd, ...rest] = trimmed.split(/\s+/);
      const args = rest.join(" ");

      if (cmd === "clear") {
        setHistory([]);
        return;
      }

      idCounter.current += 1;
      const id = `cmd-${idCounter.current}`;

      if (cmd === "cd") {
        if (args.trim() === "-") {
          if (previousCwd === null) {
            setHistory((h) => [
              ...h,
              {
                id,
                cwdAtPrompt: cwd,
                command: trimmed,
                output: ["bash: cd: OLDPWD not set"],
                isError: true,
              },
            ]);
          } else {
            const target = previousCwd;
            setHistory((h) => [
              ...h,
              { id, cwdAtPrompt: cwd, command: trimmed, output: [pathToString(target)] },
            ]);
            setPreviousCwd(cwd);
            setCwd(target);
          }
          return;
        }

        const result = resolveCd(cwd, args);
        if ("error" in result) {
          setHistory((h) => [
            ...h,
            { id, cwdAtPrompt: cwd, command: trimmed, output: [result.error], isError: true },
          ]);
        } else {
          setHistory((h) => [
            ...h,
            { id, cwdAtPrompt: cwd, command: trimmed, output: [] },
          ]);
          setPreviousCwd(cwd);
          setCwd(result.next);
        }
        return;
      }

      if (cmd === "pwd") {
        setHistory((h) => [
          ...h,
          { id, cwdAtPrompt: cwd, command: trimmed, output: [pathToString(cwd)] },
        ]);
        return;
      }

      setHistory((h) => [
        ...h,
        {
          id,
          cwdAtPrompt: cwd,
          command: trimmed,
          output: [`bash: ${cmd}: command not found`],
          isError: true,
        },
      ]);
    },
    [cwd, previousCwd],
  );

  return (
    <div className="flex h-[85vh] max-h-[880px] min-h-[480px] w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        <span className="ml-2 font-mono text-xs text-zinc-500">
          bash — {pathToString(cwd)}
        </span>

        <div className="ml-auto flex items-center gap-0.5 rounded-full bg-zinc-950 p-0.5">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setView(option.value)}
              className={`rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors ${
                view === option.value
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 border-b border-zinc-800">
        {view !== "graph" && (
          <div
            className={`min-h-0 min-w-0 overflow-y-auto p-4 sm:p-6 ${
              view === "both" ? "w-72 flex-none border-r border-zinc-800" : "flex-1"
            }`}
          >
            <FileTree cwd={cwd} onRunCommand={runCommand} />
          </div>
        )}
        {view !== "tree" && (
          <div className="min-h-0 min-w-0 flex-1 p-4 sm:p-6">
            <DirectoryGraph cwd={cwd} onRunCommand={runCommand} />
          </div>
        )}
      </div>

      <Terminal cwd={cwd} history={history} onSubmit={runCommand} />
    </div>
  );
}
