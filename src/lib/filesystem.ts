// The demo directory tree the terminal and graph both operate on.
// Everything is a directory for now — no files, since the only commands
// taught so far are `cd` and `cd ..`.

export type DirNode = {
  name: string;
  children?: DirNode[];
};

export const ROOT_NAME = "~";

export const filesystem: DirNode = {
  name: ROOT_NAME,
  children: [
    {
      name: "projects",
      children: [
        { name: "bashhero" },
        { name: "vimhero" },
        { name: "dotfiles" },
      ],
    },
    {
      name: "documents",
      children: [{ name: "notes" }, { name: "taxes" }],
    },
    { name: "downloads" },
    {
      name: "pictures",
      children: [{ name: "vacation" }, { name: "screenshots" }],
    },
  ],
};

/** A path is a list of node names from the root, e.g. ["~", "projects", "bashhero"]. */
export type Path = string[];

export function pathToString(path: Path): string {
  if (path.length === 1) return ROOT_NAME;
  return path.join("/");
}

export function pathKey(path: Path): string {
  return path.join("/");
}

/** Walk the tree following a path of names, returning the node at the end (or undefined). */
export function getNodeAt(path: Path): DirNode | undefined {
  let node: DirNode = filesystem;
  for (const segment of path.slice(1)) {
    const next = node.children?.find((c) => c.name === segment);
    if (!next) return undefined;
    node = next;
  }
  return node;
}

export type CdResult = { next: Path } | { error: string };

/** Resolve `cd <arg>` (or bare `cd`) from the current path into a new path. */
export function resolveCd(cwd: Path, argRaw: string): CdResult {
  const arg = argRaw.trim();
  if (arg === "" || arg === ROOT_NAME) return { next: [ROOT_NAME] };

  const segments = arg.split("/").filter(Boolean);
  let next = [...cwd];

  for (const segment of segments) {
    if (segment === ".") continue;
    if (segment === "..") {
      if (next.length > 1) next = next.slice(0, -1);
      continue;
    }
    const node = getNodeAt(next);
    const child = node?.children?.find((c) => c.name === segment);
    if (!child) {
      return { error: `cd: no such file or directory: ${argRaw}` };
    }
    next = [...next, segment];
  }

  return { next };
}

// --- Relation ---------------------------------------------------------------

export type Relation = "self" | "parent" | "child" | "other";

/** How `nodePath` relates to `cwd` — used to decide what's clickable/highlighted. */
export function getRelation(nodePath: Path, cwd: Path): Relation {
  const nodeKey = pathKey(nodePath);
  const cwdKey = pathKey(cwd);
  if (nodeKey === cwdKey) return "self";
  if (
    nodePath.length === cwd.length - 1 &&
    nodePath.every((seg, i) => seg === cwd[i])
  ) {
    return "parent";
  }
  if (
    nodePath.length === cwd.length + 1 &&
    cwd.every((seg, i) => seg === nodePath[i])
  ) {
    return "child";
  }
  return "other";
}

// --- Tree rows --------------------------------------------------------------

export type TreeRow = {
  path: Path;
  name: string;
  prefix: string;
  hasChildren: boolean;
};

/** Flatten the tree into rows with `tree`-style connector prefixes, e.g. "│   ├── ". */
export function buildTreeRows(): TreeRow[] {
  const rows: TreeRow[] = [];

  function visit(node: DirNode, path: Path, prefix: string, isLast: boolean, isRoot: boolean) {
    const children = node.children ?? [];
    rows.push({
      path,
      name: node.name,
      prefix: isRoot ? "" : prefix + (isLast ? "└── " : "├── "),
      hasChildren: children.length > 0,
    });

    const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");
    children.forEach((child, i) => {
      visit(child, [...path, child.name], childPrefix, i === children.length - 1, false);
    });
  }

  visit(filesystem, [ROOT_NAME], "", true, true);
  return rows;
}

// --- Layout ---------------------------------------------------------------

export type LayoutNode = {
  name: string;
  path: Path;
  depth: number;
  x: number;
  y: number;
  hasChildren: boolean;
};

export type LayoutEdge = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  parentPath: Path;
  childPath: Path;
};

export type Layout = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
};

const SPACING_X = 105;
const SPACING_Y = 125;

/** Lay out the tree: leaves get sequential x slots, parents center over their children. */
export function layoutFilesystem(): Layout {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const leafCounter = { n: 0 };

  function visit(node: DirNode, depth: number, path: Path): LayoutNode {
    const children = node.children ?? [];
    let x: number;

    if (children.length === 0) {
      x = leafCounter.n * SPACING_X;
      leafCounter.n += 1;
    } else {
      const childLayouts = children.map((child) =>
        visit(child, depth + 1, [...path, child.name]),
      );
      const xs = childLayouts.map((c) => c.x);
      x = (Math.min(...xs) + Math.max(...xs)) / 2;
      for (const childLayout of childLayouts) {
        edges.push({
          from: { x, y: depth * SPACING_Y },
          to: { x: childLayout.x, y: childLayout.y },
          parentPath: path,
          childPath: childLayout.path,
        });
      }
    }

    const self: LayoutNode = {
      name: node.name,
      path,
      depth,
      x,
      y: depth * SPACING_Y,
      hasChildren: children.length > 0,
    };
    nodes.push(self);
    return self;
  }

  visit(filesystem, 0, [ROOT_NAME]);

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const bounds = {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };

  return { nodes, edges, bounds };
}
