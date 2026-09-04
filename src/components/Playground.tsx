"use client";

import { useCallback, useRef, useState } from "react";
import { Terminal, type HistoryEntry } from "./Terminal";
import { DirectoryGraph } from "./DirectoryGraph";
import { ROOT_NAME, pathToString, resolveCd, type Path } from "@/lib/filesystem";

const INITIAL_HISTORY: HistoryEntry[] = [
  {
    id: "welcome",
    cwdAtPrompt: [ROOT_NAME],
    command: "",
    output: [
      "Welcome to BashHero.",
      "Try `cd projects` to move into a directory, and `cd ..` to move back up.",
      "You can also click a directory in the graph.",
    ],
  },
];

export function Playground() {
  const [cwd, setCwd] = useState<Path>([ROOT_NAME]);
  const [history, setHistory] = useState<HistoryEntry[]>(INITIAL_HISTORY);
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
    [cwd],
  );

  return (
    <div className="flex h-[68vh] max-h-[720px] min-h-[420px] w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        <span className="ml-2 font-mono text-xs text-zinc-500">
          bash — {pathToString(cwd)}
        </span>
      </div>

      <div className="min-h-0 flex-1 border-b border-zinc-800 p-4 sm:p-6">
        <DirectoryGraph cwd={cwd} onRunCommand={runCommand} />
      </div>

      <Terminal cwd={cwd} history={history} onSubmit={runCommand} />
    </div>
  );
}
