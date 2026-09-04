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
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1">
        <Terminal cwd={cwd} history={history} onSubmit={runCommand} />
      </div>
      <div className="min-w-0 flex-1">
        <DirectoryGraph cwd={cwd} onRunCommand={runCommand} />
      </div>
    </div>
  );
}
