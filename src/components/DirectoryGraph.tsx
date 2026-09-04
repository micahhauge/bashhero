"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { layoutFilesystem, pathKey, type LayoutNode, type Path } from "@/lib/filesystem";

const PADDING = 60;
const NODE_RADIUS = 22;

type Relation = "self" | "parent" | "child" | "other";

function getRelation(node: LayoutNode, cwd: Path): Relation {
  const nodeKey = pathKey(node.path);
  const cwdKey = pathKey(cwd);
  if (nodeKey === cwdKey) return "self";
  if (
    node.path.length === cwd.length - 1 &&
    node.path.every((seg, i) => seg === cwd[i])
  ) {
    return "parent";
  }
  if (
    node.path.length === cwd.length + 1 &&
    cwd.every((seg, i) => seg === node.path[i])
  ) {
    return "child";
  }
  return "other";
}

export function DirectoryGraph({
  cwd,
  onRunCommand,
}: {
  cwd: Path;
  onRunCommand: (raw: string) => void;
}) {
  const { nodes, edges, bounds } = useMemo(() => layoutFilesystem(), []);

  const cwdKey = pathKey(cwd);
  const current = nodes.find((n) => pathKey(n.path) === cwdKey)!;

  const chain = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < cwd.length; i++) set.add(pathKey(cwd.slice(0, i + 1)));
    return set;
  }, [cwd]);

  const viewBox = `${bounds.minX - PADDING} ${bounds.minY - PADDING - 30} ${
    bounds.maxX - bounds.minX + PADDING * 2
  } ${bounds.maxY - bounds.minY + PADDING * 2 + 30}`;

  function handleNodeClick(node: LayoutNode) {
    const relation = getRelation(node, cwd);
    if (relation === "parent") onRunCommand("cd ..");
    if (relation === "child") onRunCommand(`cd ${node.name}`);
  }

  return (
    <div className="h-full w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-black/40">
      <svg viewBox={viewBox} className="h-80 w-full lg:h-full">
        {edges.map((edge) => {
          const active = chain.has(pathKey(edge.childPath));
          return (
            <motion.line
              key={pathKey(edge.childPath)}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              initial={false}
              animate={{
                stroke: active ? "#34d399" : "#3f3f46",
                strokeWidth: active ? 2.5 : 1.5,
              }}
              transition={{ duration: 0.35 }}
            />
          );
        })}

        {/* pulse ring that restarts every time you land on a new directory */}
        <motion.circle
          key={cwdKey}
          cx={current.x}
          cy={current.y}
          r={NODE_RADIUS}
          fill="none"
          stroke="#34d399"
          strokeWidth={2}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ transformOrigin: `${current.x}px ${current.y}px` }}
        />

        {nodes.map((node) => {
          const key = pathKey(node.path);
          const relation = getRelation(node, cwd);
          const isCurrent = relation === "self";
          const onChain = chain.has(key);
          const clickable = relation === "parent" || relation === "child";

          return (
            <g
              key={key}
              onClick={() => handleNodeClick(node)}
              className={clickable ? "cursor-pointer" : ""}
            >
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                initial={false}
                whileHover={clickable ? { scale: 1.08 } : undefined}
                whileTap={clickable ? { scale: 0.95 } : undefined}
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                  fill: isCurrent ? "#10b981" : onChain ? "#134e33" : "#18181b",
                  stroke: isCurrent ? "#6ee7b7" : onChain ? "#34d399" : "#52525b",
                  strokeWidth: isCurrent ? 3 : 1.5,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
              <text
                x={node.x}
                y={node.y + NODE_RADIUS + 16}
                textAnchor="middle"
                className={`select-none font-mono text-[11px] ${
                  isCurrent
                    ? "fill-emerald-300 font-semibold"
                    : onChain
                      ? "fill-emerald-500"
                      : "fill-zinc-500"
                }`}
              >
                {node.name}
              </text>
            </g>
          );
        })}

        {/* the traveler: a pin that glides between nodes as cwd changes */}
        <motion.text
          initial={false}
          animate={{ x: current.x, y: current.y - NODE_RADIUS - 12 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          textAnchor="middle"
          fontSize={20}
          className="pointer-events-none select-none"
        >
          📍
        </motion.text>
      </svg>
    </div>
  );
}
