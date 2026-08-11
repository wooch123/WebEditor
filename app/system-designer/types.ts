export const SYSTEM_NODE_TYPES = [
  "page",
  "component",
  "api",
  "logic",
  "table",
  "field",
  "flow",
  "role",
  "storage",
  "external",
] as const;

export type SystemNodeType = (typeof SYSTEM_NODE_TYPES)[number];
export type CrudOperation = "-" | "C" | "R" | "U" | "D" | "CR" | "CU" | "CD" | "RU" | "RD" | "UD" | "CRU" | "CRD" | "CUD" | "RUD" | "CRUD";

export type SystemNode = {
  id: string;
  type: SystemNodeType;
  name: string;
  description: string;
  x: number;
  y: number;
  parentId?: string;
  metadata: Record<string, string>;
};

export type SystemBinding = {
  id: string;
  sourceId: string;
  targetId: string;
  bindingType: string;
  operation: CrudOperation;
  label?: string;
  metadata?: Record<string, string>;
};

export type SystemProject = {
  version: 1;
  id: string;
  name: string;
  description: string;
  updatedAt: number;
  nodes: SystemNode[];
  bindings: SystemBinding[];
};

export type DesignerView = "system" | "page-map" | "page" | "database" | "api" | "flow" | "permission" | "lineage" | "matrix" | "problems" | "docs";
export type DesignerLayer = "PAGE" | "UI" | "API" | "DB" | "FLOW" | "AUTH";

export const TYPE_META: Record<SystemNodeType, { label: string; short: string; layer: DesignerLayer; icon: string }> = {
  page: { label: "Pages", short: "PAGE", layer: "PAGE", icon: "▣" },
  component: { label: "Components", short: "UI", layer: "UI", icon: "◇" },
  api: { label: "APIs", short: "API", layer: "API", icon: "↗" },
  logic: { label: "Business Logic", short: "LOGIC", layer: "FLOW", icon: "⌘" },
  table: { label: "Database Tables", short: "TABLE", layer: "DB", icon: "▤" },
  field: { label: "Database Fields", short: "FIELD", layer: "DB", icon: "·" },
  flow: { label: "Flows", short: "FLOW", layer: "FLOW", icon: "⇢" },
  role: { label: "Roles", short: "AUTH", layer: "AUTH", icon: "♙" },
  storage: { label: "Storage", short: "STORE", layer: "DB", icon: "▱" },
  external: { label: "External Services", short: "EXT", layer: "FLOW", icon: "◎" },
};

export function createSystemId(prefix: string) {
  void prefix;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const value = Math.floor(Math.random() * 16);
    return (token === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
}
