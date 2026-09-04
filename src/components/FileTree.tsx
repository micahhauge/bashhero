"use client";

import { useMemo } from "react";
import { buildTreeRows, getRelation, pathKey, type Path } from "@/lib/filesystem";

export function FileTree({
  cwd,
  onRunCommand,
}: {
  cwd: Path;
  onRunCommand: (raw: string) => void;
}) {
  const rows = useMemo(() => buildTreeRows(), []);

  const chain = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < cwd.length; i++) set.add(pathKey(cwd.slice(0, i + 1)));
    return set;
  }, [cwd]);

  function handleClick(row: (typeof rows)[number], relation: string) {
    if (relation === "parent") onRunCommand("cd ..");
    if (relation === "child") onRunCommand(`cd ${row.name}`);
  }

  return (
    <div className="h-full w-full overflow-y-auto font-mono text-sm sm:text-[15px]">
      {rows.map((row) => {
        const key = pathKey(row.path);
        const relation = getRelation(row.path, cwd);
        const isCurrent = relation === "self";
        const onChain = chain.has(key);
        const clickable = relation === "parent" || relation === "child";

        return (
          <div
            key={key}
            onClick={() => handleClick(row, relation)}
            className={`whitespace-pre leading-relaxed ${clickable ? "cursor-pointer" : ""}`}
          >
            <span className="text-zinc-700">{row.prefix}</span>
            <span
              className={
                isCurrent
                  ? "rounded bg-emerald-500/20 px-1 font-semibold text-emerald-300"
                  : onChain
                    ? "text-emerald-500"
                    : clickable
                      ? "text-zinc-400 hover:text-zinc-200"
                      : "text-zinc-500"
              }
            >
              {isCurrent ? "📂 " : "📁 "}
              {row.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
