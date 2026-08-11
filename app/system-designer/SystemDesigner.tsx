"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  SYSTEM_NODE_TYPES,
  TYPE_META,
  createSystemId,
  type CrudOperation,
  type DesignerLayer,
  type DesignerView,
  type SystemBinding,
  type SystemNode,
  type SystemNodeType,
  type SystemProject,
} from "./types";

type SystemDesignerProps = {
  project: SystemProject;
  onChange: (project: SystemProject) => void;
  onOpenPage: (node: SystemNode) => void;
  onToast: (message: string) => void;
};

type Problem = { id: string; severity: "error" | "warning"; title: string; detail: string; nodeId?: string };

const STAGE_WIDTH = 2140;
const STAGE_HEIGHT = 1220;
const NODE_WIDTH = 232;
const NODE_HEIGHT = 104;
const LAYERS: DesignerLayer[] = ["PAGE", "UI", "API", "DB", "FLOW", "AUTH"];

const VIEW_ITEMS: Array<{ id: DesignerView; label: string; short: string }> = [
  { id: "system", label: "전체 시스템", short: "SYSTEM" },
  { id: "page-map", label: "페이지 맵", short: "MAP" },
  { id: "page", label: "페이지 설계", short: "PAGE" },
  { id: "database", label: "DB 설계", short: "ERD" },
  { id: "api", label: "API 설계", short: "API" },
  { id: "flow", label: "업무 흐름", short: "FLOW" },
  { id: "permission", label: "권한", short: "AUTH" },
  { id: "lineage", label: "데이터 계보", short: "LINEAGE" },
  { id: "matrix", label: "CRUD 매트릭스", short: "MATRIX" },
  { id: "problems", label: "설계 검사", short: "PROBLEMS" },
  { id: "docs", label: "문서", short: "DOCS" },
];

const VIEW_TYPES: Record<DesignerView, SystemNodeType[]> = {
  system: [...SYSTEM_NODE_TYPES],
  "page-map": ["page"],
  page: ["page", "component", "api", "field"],
  database: ["table", "field"],
  api: ["component", "api", "logic", "table"],
  flow: ["page", "component", "flow", "api", "logic", "table", "external", "storage"],
  permission: ["role", "page", "component", "api"],
  lineage: ["page", "component", "api", "logic", "table", "field", "storage", "external"],
  matrix: [...SYSTEM_NODE_TYPES],
  problems: [...SYSTEM_NODE_TYPES],
  docs: [...SYSTEM_NODE_TYPES],
};

const TYPE_ORDER: SystemNodeType[] = ["page", "component", "api", "logic", "table", "field", "flow", "role", "storage", "external"];

const META_FIELDS: Record<SystemNodeType, Array<{ key: string; label: string; placeholder: string }>> = {
  page: [
    { key: "route", label: "Route", placeholder: "/employees" },
    { key: "roles", label: "Available Roles", placeholder: "ADMIN, MANAGER" },
    { key: "crud", label: "CRUD", placeholder: "CRU" },
  ],
  component: [
    { key: "componentType", label: "Component Type", placeholder: "Table" },
    { key: "dataSource", label: "Data Source", placeholder: "GET /api/items" },
    { key: "event", label: "Event", placeholder: "LOAD, CLICK" },
    { key: "validation", label: "Validation", placeholder: "required" },
    { key: "permission", label: "Permission", placeholder: "ADMIN" },
    { key: "visibility", label: "Visibility", placeholder: "status = ACTIVE" },
  ],
  api: [
    { key: "method", label: "Method", placeholder: "GET" },
    { key: "path", label: "Path", placeholder: "/api/items" },
    { key: "request", label: "Request", placeholder: "page, limit" },
    { key: "response", label: "Response", placeholder: "items[], total" },
    { key: "auth", label: "Authentication", placeholder: "Bearer" },
  ],
  logic: [
    { key: "input", label: "Input", placeholder: "Command" },
    { key: "process", label: "Process", placeholder: "Validate → Query" },
    { key: "condition", label: "Condition", placeholder: "permission = true" },
    { key: "output", label: "Output", placeholder: "Result DTO" },
  ],
  table: [
    { key: "schema", label: "Schema", placeholder: "public" },
    { key: "primaryKey", label: "Primary Key", placeholder: "id" },
    { key: "indexes", label: "Indexes", placeholder: "email UNIQUE" },
    { key: "relation", label: "Relationships", placeholder: "department 1:N" },
  ],
  field: [
    { key: "dataType", label: "Data Type", placeholder: "varchar(100)" },
    { key: "key", label: "Key", placeholder: "PK / FK" },
    { key: "nullable", label: "Nullable", placeholder: "NO" },
    { key: "index", label: "Index", placeholder: "INDEX" },
  ],
  flow: [
    { key: "trigger", label: "Trigger", placeholder: "CLICK" },
    { key: "steps", label: "Steps", placeholder: "Validate → API → Toast" },
    { key: "result", label: "Result", placeholder: "Refresh" },
  ],
  role: [
    { key: "pageAccess", label: "Page Access", placeholder: "Dashboard, Employees" },
    { key: "componentVisibility", label: "Component Visibility", placeholder: "ALL" },
    { key: "apiPermission", label: "API Permission", placeholder: "READ, UPDATE" },
    { key: "crud", label: "CRUD Permission", placeholder: "RU" },
  ],
  storage: [
    { key: "storageType", label: "Storage Type", placeholder: "S3 Compatible" },
    { key: "endpoint", label: "Endpoint", placeholder: "/api/files" },
    { key: "metadataTable", label: "Metadata Table", placeholder: "file_metadata" },
    { key: "retention", label: "Retention", placeholder: "5 years" },
  ],
  external: [
    { key: "provider", label: "Provider", placeholder: "External API" },
    { key: "purpose", label: "Purpose", placeholder: "Notification" },
    { key: "retry", label: "Retry", placeholder: "3" },
  ],
};

function bindingDefaults(source: SystemNode, target: SystemNode): Pick<SystemBinding, "bindingType" | "operation"> {
  if (source.type === "page" && target.type === "component") return { bindingType: "CONTAINS", operation: "R" };
  if (source.type === "page" && target.type === "page") return { bindingType: "NAVIGATION", operation: "-" };
  if (source.type === "component" && target.type === "api") return { bindingType: "API", operation: "R" };
  if (source.type === "component" && target.type === "field") return { bindingType: "DATA", operation: "R" };
  if (source.type === "api" && target.type === "logic") return { bindingType: "CALLS", operation: source.metadata.method === "POST" ? "C" : source.metadata.method === "PUT" || source.metadata.method === "PATCH" ? "U" : source.metadata.method === "DELETE" ? "D" : "R" };
  if (source.type === "logic" && (target.type === "table" || target.type === "field")) return { bindingType: "DATABASE", operation: "R" };
  if (source.type === "table" && target.type === "field") return { bindingType: "FIELD", operation: "R" };
  if (source.type === "field" && target.type === "field") return { bindingType: "FK 1:N", operation: "R" };
  if (source.type === "role") return { bindingType: "PERMISSION", operation: "R" };
  if (target.type === "storage") return { bindingType: "STORAGE", operation: "U" };
  return { bindingType: "DEPENDENCY", operation: "-" };
}

function connectedIds(nodes: SystemNode[], bindings: SystemBinding[], startId: string | null) {
  if (!startId) return null;
  const validIds = new Set(nodes.map((node) => node.id));
  const result = new Set([startId]);
  const walk = (direction: "incoming" | "outgoing") => {
    const visited = new Set([startId]);
    const queue = [startId];
    while (queue.length) {
      const current = queue.shift()!;
      bindings.forEach((edge) => {
        const next = direction === "incoming"
          ? edge.targetId === current ? edge.sourceId : null
          : edge.sourceId === current ? edge.targetId : null;
        if (next && validIds.has(next) && !visited.has(next)) {
          visited.add(next);
          result.add(next);
          queue.push(next);
        }
      });
    }
  };
  walk("incoming");
  walk("outgoing");
  return result;
}

function validateProject(project: SystemProject): Problem[] {
  const problems: Problem[] = [];
  const ids = new Set(project.nodes.map((node) => node.id));
  const degree = new Map(project.nodes.map((node) => [node.id, 0]));
  project.bindings.forEach((edge) => {
    if (!ids.has(edge.sourceId) || !ids.has(edge.targetId)) {
      problems.push({ id: `missing-${edge.id}`, severity: "error", title: "연결 대상이 존재하지 않음", detail: `${edge.bindingType} 연결의 시작 또는 끝 Node가 없습니다.` });
      return;
    }
    degree.set(edge.sourceId, (degree.get(edge.sourceId) ?? 0) + 1);
    degree.set(edge.targetId, (degree.get(edge.targetId) ?? 0) + 1);
  });
  project.nodes.forEach((node) => {
    if ((degree.get(node.id) ?? 0) === 0) problems.push({ id: `unused-${node.id}`, severity: "warning", title: "사용되지 않는 Object", detail: `${node.name}에 연결된 관계가 없습니다.`, nodeId: node.id });
    if (node.type === "api" && !project.bindings.some((edge) => edge.sourceId === node.id && ["logic", "table"].includes(project.nodes.find((item) => item.id === edge.targetId)?.type ?? ""))) problems.push({ id: `api-${node.id}`, severity: "error", title: "API 데이터 연결 누락", detail: `${node.name}에 Business Logic 또는 DB 연결이 없습니다.`, nodeId: node.id });
    if (node.type === "component" && !project.bindings.some((edge) => edge.sourceId === node.id && ["api", "field", "storage"].includes(project.nodes.find((item) => item.id === edge.targetId)?.type ?? ""))) problems.push({ id: `component-${node.id}`, severity: "warning", title: "Component 데이터 소스 누락", detail: `${node.name}에 API 또는 DB Field가 연결되지 않았습니다.`, nodeId: node.id });
    if (node.type === "page" && !project.bindings.some((edge) => edge.targetId === node.id && project.nodes.find((item) => item.id === edge.sourceId)?.type === "role")) problems.push({ id: `permission-${node.id}`, severity: "warning", title: "Page 권한 미설정", detail: `${node.name}에 접근 가능한 Role이 연결되지 않았습니다.`, nodeId: node.id });
    if (node.type === "field" && !node.metadata.dataType?.trim()) problems.push({ id: `field-${node.id}`, severity: "error", title: "DB Field Type 누락", detail: `${node.name}의 데이터 타입을 입력하세요.`, nodeId: node.id });
  });
  return problems;
}

function collectCrudOperations(project: SystemProject, pageId: string, tableId: string) {
  const operations = new Set<string>();
  const visit = (nodeId: string, path: Set<string>, inherited: string[], depth: number) => {
    if (depth > 7) return;
    if (nodeId === tableId) {
      inherited.forEach((operation) => operation.split("").forEach((item) => operations.add(item)));
      return;
    }
    project.bindings.filter((edge) => edge.sourceId === nodeId).forEach((edge) => {
      if (path.has(edge.targetId)) return;
      const nextPath = new Set(path).add(edge.targetId);
      visit(edge.targetId, nextPath, edge.operation === "-" ? inherited : [...inherited, edge.operation], depth + 1);
    });
  };
  visit(pageId, new Set([pageId]), [], 0);
  return ["C", "R", "U", "D"].filter((operation) => operations.has(operation)).join("") || "-";
}

function buildMarkdown(project: SystemProject) {
  const byType = (type: SystemNodeType) => project.nodes.filter((node) => node.type === type);
  const lines = [
    `# ${project.name}`,
    "",
    project.description,
    "",
    "## System Overview",
    "",
    `- Pages: ${byType("page").length}`,
    `- Components: ${byType("component").length}`,
    `- APIs: ${byType("api").length}`,
    `- Database Tables: ${byType("table").length}`,
    `- Bindings: ${project.bindings.length}`,
    "",
    "## Pages",
    "",
    ...byType("page").map((node) => `- **${node.name}** — \`${node.metadata.route || "-"}\` (${node.metadata.crud || "-"})`),
    "",
    "## API Specification",
    "",
    ...byType("api").map((node) => `- **${node.metadata.method || "API"} ${node.metadata.path || node.name}** — Request: ${node.metadata.request || "-"}; Response: ${node.metadata.response || "-"}`),
    "",
    "## Database Dictionary",
    "",
    ...byType("table").flatMap((table) => [
      `### ${table.name}`,
      "",
      ...byType("field").filter((field) => field.parentId === table.id).map((field) => `- \`${field.name}\` — ${field.metadata.dataType || "unknown"} ${field.metadata.key || ""}`),
      "",
    ]),
    "## Relationships",
    "",
    ...project.bindings.map((edge) => {
      const source = project.nodes.find((node) => node.id === edge.sourceId)?.name ?? edge.sourceId;
      const target = project.nodes.find((node) => node.id === edge.targetId)?.name ?? edge.targetId;
      return `- ${source} → ${target} (${edge.bindingType}${edge.operation !== "-" ? ` / ${edge.operation}` : ""})`;
    }),
    "",
    "## Dependency Map (Mermaid)",
    "",
    "```mermaid",
    "flowchart LR",
    ...project.nodes.map((node) => `  ${node.id.replace(/[^a-zA-Z0-9_]/g, "_")}["${node.name.replace(/"/g, "'")}"]`),
    ...project.bindings.map((edge) => `  ${edge.sourceId.replace(/[^a-zA-Z0-9_]/g, "_")} -->|${edge.bindingType}| ${edge.targetId.replace(/[^a-zA-Z0-9_]/g, "_")}`),
    "```",
  ];
  return lines.join("\n");
}

function nodeSubtitle(node: SystemNode) {
  if (node.type === "page") return node.metadata.route || "Route 미설정";
  if (node.type === "api") return `${node.metadata.method || "API"} · ${node.metadata.path || "Path 미설정"}`;
  if (node.type === "field") return `${node.metadata.dataType || "Type 미설정"}${node.metadata.key ? ` · ${node.metadata.key}` : ""}`;
  if (node.type === "table") return `${node.metadata.schema || "public"} · PK ${node.metadata.primaryKey || "-"}`;
  if (node.type === "component") return node.metadata.componentType || "Custom Component";
  if (node.type === "role") return node.metadata.crud ? `CRUD ${node.metadata.crud}` : "Role Permission";
  return node.description || TYPE_META[node.type].label;
}

export function SystemDesigner({ project, onChange, onOpenPage, onToast }: SystemDesignerProps) {
  const [view, setView] = useState<DesignerView>("system");
  const [selectedId, setSelectedId] = useState<string | null>(() => project.nodes.find((node) => node.name === "Employee List")?.id ?? project.nodes[0]?.id ?? null);
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<DesignerLayer>>(() => new Set(LAYERS));
  const [zoom, setZoom] = useState(0.78);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [explorerOpen, setExplorerOpen] = useState<Set<SystemNodeType>>(() => new Set(SYSTEM_NODE_TYPES));
  const dragRef = useRef<{ id: string; pointerId: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const selectedNode = project.nodes.find((node) => node.id === selectedId) ?? null;
  const selectedRelatedIds = useMemo(() => connectedIds(project.nodes, project.bindings, selectedId), [project.nodes, project.bindings, selectedId]);
  const problems = useMemo(() => validateProject(project), [project]);
  const allowedTypes = VIEW_TYPES[view];
  const visibleNodes = useMemo(() => project.nodes.filter((node) => allowedTypes.includes(node.type) && activeLayers.has(TYPE_META[node.type].layer)), [project.nodes, allowedTypes, activeLayers]);
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);
  const visibleBindings = useMemo(() => project.bindings.filter((edge) => visibleNodeIds.has(edge.sourceId) && visibleNodeIds.has(edge.targetId)), [project.bindings, visibleNodeIds]);
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("ko-KR");
    if (!query) return project.nodes.slice(0, 14);
    return project.nodes.filter((node) => `${node.name} ${node.description} ${Object.values(node.metadata).join(" ")} ${TYPE_META[node.type].label}`.toLocaleLowerCase("ko-KR").includes(query)).slice(0, 30);
  }, [project.nodes, searchQuery]);

  const updateProject = (updater: (current: SystemProject) => SystemProject) => onChange(updater(project));
  const updateNode = (nodeId: string, patch: Partial<SystemNode>) => updateProject((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === nodeId ? { ...node, ...patch } : node) }));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setConnectionSourceId(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  const selectNode = (nodeId: string) => {
    if (connectionSourceId && connectionSourceId !== nodeId) {
      const source = project.nodes.find((node) => node.id === connectionSourceId);
      const target = project.nodes.find((node) => node.id === nodeId);
      if (source && target) {
        if (project.bindings.some((edge) => edge.sourceId === source.id && edge.targetId === target.id)) onToast("이미 같은 방향의 연결이 있습니다.");
        else {
          const defaults = bindingDefaults(source, target);
          updateProject((current) => ({ ...current, bindings: [...current.bindings, { id: createSystemId("binding"), sourceId: source.id, targetId: target.id, ...defaults }] }));
          onToast(`${source.name} → ${target.name} 관계를 연결했습니다.`);
        }
      }
      setConnectionSourceId(null);
    }
    setSelectedId(nodeId);
  };

  const addNode = (type: SystemNodeType) => {
    const requested = window.prompt(`${TYPE_META[type].label} 이름`, `새 ${TYPE_META[type].short}`)?.trim();
    if (!requested) return;
    const typeIndex = TYPE_ORDER.indexOf(type);
    const siblingCount = project.nodes.filter((node) => node.type === type).length;
    const parent = type === "component" && selectedNode?.type === "page" ? selectedNode : type === "field" && selectedNode?.type === "table" ? selectedNode : null;
    const newNode: SystemNode = {
      id: createSystemId(type),
      type,
      name: requested,
      description: "",
      x: 80 + (typeIndex % 6) * 330,
      y: 80 + Math.floor(typeIndex / 6) * 470 + (siblingCount % 5) * 135,
      metadata: Object.fromEntries(META_FIELDS[type].map((field) => [field.key, ""])),
      ...(parent ? { parentId: parent.id } : {}),
    };
    updateProject((current) => ({
      ...current,
      nodes: [...current.nodes, newNode],
      bindings: parent ? [...current.bindings, { id: createSystemId("binding"), sourceId: parent.id, targetId: newNode.id, ...bindingDefaults(parent, newNode) }] : current.bindings,
    }));
    setSelectedId(newNode.id);
    setView(type === "table" || type === "field" ? "database" : type === "api" ? "api" : type === "role" ? "permission" : "system");
    onToast(`${requested} Node를 추가했습니다.`);
  };

  const deleteNode = (nodeId: string) => {
    const target = project.nodes.find((node) => node.id === nodeId);
    if (!target || !window.confirm(`‘${target.name}’ Node와 연결 관계를 삭제할까요?`)) return;
    updateProject((current) => ({ ...current, nodes: current.nodes.filter((node) => node.id !== nodeId), bindings: current.bindings.filter((edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId) }));
    setSelectedId(null);
    setConnectionSourceId((current) => current === nodeId ? null : current);
    onToast(`${target.name} Node를 삭제했습니다.`);
  };

  const deleteBinding = (bindingId: string) => updateProject((current) => ({ ...current, bindings: current.bindings.filter((edge) => edge.id !== bindingId) }));
  const updateBinding = (bindingId: string, patch: Partial<SystemBinding>) => updateProject((current) => ({ ...current, bindings: current.bindings.map((edge) => edge.id === bindingId ? { ...edge, ...patch } : edge) }));

  const toggleLayer = (layer: DesignerLayer) => setActiveLayers((current) => {
    const next = new Set(current);
    if (next.has(layer)) next.delete(layer); else next.add(layer);
    return next;
  });

  const autoLayout = () => {
    const activeTypeOrder = TYPE_ORDER.filter((type) => visibleNodes.some((node) => node.type === type));
    const positioned = new Map<string, { x: number; y: number }>();
    activeTypeOrder.forEach((type, column) => {
      visibleNodes.filter((node) => node.type === type).forEach((node, row) => positioned.set(node.id, { x: 70 + column * 315, y: 70 + row * 142 }));
    });
    updateProject((current) => ({ ...current, nodes: current.nodes.map((node) => positioned.has(node.id) ? { ...node, ...positioned.get(node.id)! } : node) }));
    onToast(`${VIEW_ITEMS.find((item) => item.id === view)?.label} 기준으로 자동 정렬했습니다.`);
  };

  const trackDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = (event.clientX - drag.startX) / zoom;
    const deltaY = (event.clientY - drag.startY) / zoom;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 3) drag.moved = true;
    updateNode(drag.id, { x: Math.max(12, Math.min(STAGE_WIDTH - NODE_WIDTH - 12, drag.originX + deltaX)), y: Math.max(12, Math.min(STAGE_HEIGHT - NODE_HEIGHT - 12, drag.originY + deltaY)) });
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    const id = dragRef.current.id;
    const moved = dragRef.current.moved;
    dragRef.current = null;
    if (!moved) selectNode(id);
  };

  const fitView = () => {
    setZoom(0.72);
    canvasRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      onToast(`${label}을 클립보드에 복사했습니다.`);
    } catch {
      onToast("클립보드 권한을 확인해 주세요.");
    }
  };

  const importProject = () => {
    try {
      const parsed = JSON.parse(importText) as SystemProject;
      if (parsed.version !== 1 || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.bindings) || !parsed.name) throw new Error("invalid");
      onChange({ ...parsed, updatedAt: Date.now() });
      setImportOpen(false);
      setImportText("");
      setSelectedId(parsed.nodes[0]?.id ?? null);
      onToast("JSON 프로젝트를 현재 설계에 적용했습니다.");
    } catch {
      onToast("올바른 System Project JSON인지 확인해 주세요.");
    }
  };

  const directBindings = selectedNode ? project.bindings.filter((edge) => edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id) : [];
  const impactNodes = selectedRelatedIds ? project.nodes.filter((node) => selectedRelatedIds.has(node.id) && node.id !== selectedId) : [];

  const renderCanvas = () => (
    <div className="system-canvas-wrap">
      <div className="system-canvas-tools">
        <div className="layer-filters" role="group" aria-label="시각화 레이어 선택">
          <button className={activeLayers.size === LAYERS.length ? "active" : ""} onClick={() => setActiveLayers(new Set(LAYERS))}>ALL</button>
          {LAYERS.map((layer) => <button key={layer} className={activeLayers.has(layer) ? "active" : ""} onClick={() => toggleLayer(layer)}>{layer}</button>)}
        </div>
        <div className="diagram-actions">
          <button onClick={autoLayout}>자동 정렬</button>
          <button onClick={fitView}>전체 보기</button>
          <span className="zoom-control"><button onClick={() => setZoom((current) => Math.max(.5, Math.round((current - .1) * 10) / 10))}>−</button><output>{Math.round(zoom * 100)}%</output><button onClick={() => setZoom((current) => Math.min(1.4, Math.round((current + .1) * 10) / 10))}>＋</button></span>
        </div>
      </div>
      {connectionSourceId && <div className="connection-banner"><span><i /> 연결 시작: <b>{project.nodes.find((node) => node.id === connectionSourceId)?.name}</b></span><span>연결할 Node를 선택하세요.</span><button onClick={() => setConnectionSourceId(null)}>취소</button></div>}
      <div className={`system-canvas ${connectionSourceId ? "is-connecting" : ""}`} ref={canvasRef}>
        <div className="system-stage-space" style={{ width: STAGE_WIDTH * zoom, height: STAGE_HEIGHT * zoom }}>
          <div className="system-stage" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${zoom})` }}>
            <svg className="system-edges" width={STAGE_WIDTH} height={STAGE_HEIGHT} aria-hidden="true">
              <defs><marker id="system-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" /></marker></defs>
              {visibleBindings.map((edge) => {
                const source = project.nodes.find((node) => node.id === edge.sourceId)!;
                const target = project.nodes.find((node) => node.id === edge.targetId)!;
                const sourceX = source.x + NODE_WIDTH;
                const sourceY = source.y + NODE_HEIGHT / 2;
                const targetX = target.x;
                const targetY = target.y + NODE_HEIGHT / 2;
                const bend = Math.max(60, Math.abs(targetX - sourceX) * .48);
                const path = targetX >= sourceX
                  ? `M ${sourceX} ${sourceY} C ${sourceX + bend} ${sourceY}, ${targetX - bend} ${targetY}, ${targetX} ${targetY}`
                  : `M ${sourceX} ${sourceY} C ${sourceX + 80} ${sourceY}, ${targetX - 80} ${targetY}, ${targetX} ${targetY}`;
                const related = !selectedRelatedIds || selectedRelatedIds.has(edge.sourceId) && selectedRelatedIds.has(edge.targetId);
                return <g key={edge.id} className={related ? "related" : "dimmed"}><path d={path} /><text x={(sourceX + targetX) / 2} y={(sourceY + targetY) / 2 - 7}>{edge.label || edge.bindingType}{edge.operation !== "-" ? ` · ${edge.operation}` : ""}</text></g>;
              })}
            </svg>
            {visibleNodes.map((node) => {
              const meta = TYPE_META[node.type];
              const related = !selectedRelatedIds || selectedRelatedIds.has(node.id);
              return <div
                className={`system-node type-${node.type} ${selectedId === node.id ? "selected" : ""} ${connectionSourceId === node.id ? "connection-source" : ""} ${related ? "related" : "dimmed"}`}
                data-layer={meta.layer}
                key={node.id}
                style={{ left: node.x, top: node.y } as CSSProperties}
                onPointerDown={(event) => {
                  if ((event.target as HTMLElement).closest("button")) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragRef.current = { id: node.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: node.x, originY: node.y, moved: false };
                }}
                onPointerMove={trackDrag}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                onDoubleClick={() => node.type === "page" && onOpenPage(node)}
              >
                <header><span className="system-node-icon">{meta.icon}</span><span>{meta.short}</span>{node.metadata.key && <b>{node.metadata.key}</b>}<i /></header>
                <strong title={node.name}>{node.name}</strong>
                <small title={nodeSubtitle(node)}>{nodeSubtitle(node)}</small>
                <footer><span>{project.bindings.filter((edge) => edge.sourceId === node.id || edge.targetId === node.id).length} links</span>{node.type === "page" && <button type="button" onClick={(event) => { event.stopPropagation(); onOpenPage(node); }}>페이지 열기 ↗</button>}</footer>
              </div>;
            })}
          </div>
        </div>
        <div className="system-minimap" aria-label="미니맵">
          <span>MINI MAP</span>
          <div>{visibleNodes.map((node) => <i key={node.id} className={`type-${node.type} ${selectedId === node.id ? "selected" : ""}`} style={{ left: `${(node.x / STAGE_WIDTH) * 100}%`, top: `${(node.y / STAGE_HEIGHT) * 100}%` }} />)}</div>
        </div>
      </div>
    </div>
  );

  const renderMatrix = () => {
    const pages = project.nodes.filter((node) => node.type === "page");
    const tables = project.nodes.filter((node) => node.type === "table");
    return <div className="matrix-view">
      <header><div><span>PAGE ↔ DATABASE</span><h2>CRUD 매트릭스</h2><p>셀을 선택하면 해당 Page에서 Table까지 이어지는 Component·API·Logic 관계를 탐색합니다.</p></div><div className="matrix-legend"><span><b>C</b>Create</span><span><b>R</b>Read</span><span><b>U</b>Update</span><span><b>D</b>Delete</span></div></header>
      <div className="matrix-scroll"><table><thead><tr><th>PAGE / TABLE</th>{tables.map((table) => <th key={table.id}>{table.name}</th>)}</tr></thead><tbody>{pages.map((page) => <tr key={page.id}><th><button onClick={() => setSelectedId(page.id)}><span>{TYPE_META.page.icon}</span><b>{page.name}</b><small>{page.metadata.route}</small></button></th>{tables.map((table) => { const value = collectCrudOperations(project, page.id, table.id); return <td key={table.id}><button className={value === "-" ? "empty" : "has-operation"} onClick={() => { setSelectedId(page.id); if (value !== "-") onToast(`${page.name} → ${table.name}: ${value}`); }}>{value}</button></td>; })}</tr>)}</tbody></table></div>
      <div className="matrix-foot"><span>R = Read</span><span>C = Create</span><span>U = Update</span><span>D = Delete</span><b>{pages.length} pages · {tables.length} tables</b></div>
    </div>;
  };

  const renderProblems = () => <div className="problems-view">
    <header><div><span>DESIGN VALIDATION</span><h2>Problems</h2><p>연결 누락, 권한, 데이터 타입과 사용되지 않는 Object를 자동 검사합니다.</p></div><div className="problem-summary"><span className="error"><b>{problems.filter((item) => item.severity === "error").length}</b>ERROR</span><span className="warning"><b>{problems.filter((item) => item.severity === "warning").length}</b>WARNING</span></div></header>
    <div className="problem-list">{problems.length === 0 ? <div className="problem-empty"><span>✓</span><h3>설계 검사를 통과했습니다</h3><p>현재 확인 가능한 구조 오류가 없습니다.</p></div> : problems.map((problem) => <button key={problem.id} onClick={() => problem.nodeId && setSelectedId(problem.nodeId)}><span className={problem.severity}>{problem.severity === "error" ? "!" : "△"}</span><span><strong>{problem.title}</strong><small>{problem.detail}</small></span><b>{problem.nodeId ? "Node 보기 →" : "Project"}</b></button>)}</div>
  </div>;

  const markdown = useMemo(() => buildMarkdown(project), [project]);
  const renderDocs = () => <div className="docs-view">
    <header><div><span>ARCHITECTURE DOCUMENTATION</span><h2>설계 문서</h2><p>현재 Project Model을 기준으로 문서와 AI가 다시 사용할 수 있는 구조화 JSON을 생성합니다.</p></div><div><button onClick={() => copyText(markdown, "Markdown 문서")}>Markdown 복사</button><button onClick={() => copyText(JSON.stringify(project, null, 2), "Project JSON")}>JSON 복사</button><button onClick={() => setImportOpen(true)}>JSON 가져오기</button></div></header>
    <div className="docs-paper"><pre>{markdown}</pre></div>
  </div>;

  return <section className="system-designer">
    <header className="designer-viewbar">
      <div className="view-tabs" role="tablist" aria-label="시스템 설계 보기 모드">{VIEW_ITEMS.map((item) => <button key={item.id} role="tab" aria-selected={view === item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)} title={item.label}><span>{item.short}</span><small>{item.label}</small></button>)}</div>
      <button className="global-search-button" onClick={() => setSearchOpen(true)}><span>⌕</span> 전체 검색 <kbd>Ctrl K</kbd></button>
    </header>
    <div className="designer-grid">
      <aside className="project-explorer">
        <header><span>PROJECT EXPLORER</span><h2>{project.name}</h2><p>{project.nodes.length} objects · {project.bindings.length} bindings</p></header>
        <div className="explorer-tree">
          {TYPE_ORDER.map((type) => {
            const items = project.nodes.filter((node) => node.type === type);
            const open = explorerOpen.has(type);
            return <section key={type}>
              <div className="explorer-group-head"><button onClick={() => setExplorerOpen((current) => { const next = new Set(current); if (next.has(type)) next.delete(type); else next.add(type); return next; })}><span className={open ? "open" : ""}>›</span><i>{TYPE_META[type].icon}</i><b>{TYPE_META[type].label}</b><em>{items.length}</em></button><button onClick={() => addNode(type)} aria-label={`${TYPE_META[type].label} 추가`}>＋</button></div>
              {open && <div className="explorer-items">{items.map((node) => <button key={node.id} className={selectedId === node.id ? "active" : ""} onClick={() => selectNode(node.id)}><i className={`type-${node.type}`} /><span title={node.name}>{node.name}</span>{problems.some((problem) => problem.nodeId === node.id) && <b>!</b>}</button>)}</div>}
            </section>;
          })}
        </div>
        <footer><button onClick={() => setImportOpen(true)}>JSON 가져오기</button><button onClick={() => copyText(JSON.stringify(project, null, 2), "Project JSON")}>JSON 복사</button></footer>
      </aside>

      <main className="designer-main">
        {view === "matrix" ? renderMatrix() : view === "problems" ? renderProblems() : view === "docs" ? renderDocs() : renderCanvas()}
        {!(["matrix", "problems", "docs"] as DesignerView[]).includes(view) && <div className="designer-problems-bar"><button onClick={() => setView("problems")}><span className="error">{problems.filter((item) => item.severity === "error").length} errors</span><span className="warning">{problems.filter((item) => item.severity === "warning").length} warnings</span></button><span>{selectedNode ? `${selectedNode.name} · 연결된 전체 Object ${impactNodes.length}개` : "Node를 선택하면 양방향 Dependency와 영향 범위를 표시합니다."}</span><button onClick={() => setView("lineage")}>Dependency 보기 →</button></div>}
      </main>

      <aside className="property-inspector">
        {selectedNode ? <>
          <header><span>PROPERTIES</span><div><i className={`type-${selectedNode.type}`}>{TYPE_META[selectedNode.type].icon}</i><span><b>{TYPE_META[selectedNode.type].short}</b><small>{selectedNode.id}</small></span></div></header>
          <div className="inspector-scroll">
            <section className="inspector-section"><h3>General</h3><label><span>Name</span><input value={selectedNode.name} onChange={(event) => updateNode(selectedNode.id, { name: event.target.value })} /></label><label><span>Description</span><textarea rows={3} value={selectedNode.description} onChange={(event) => updateNode(selectedNode.id, { description: event.target.value })} placeholder="Object의 역할과 책임" /></label>{META_FIELDS[selectedNode.type].map((field) => <label key={field.key}><span>{field.label}</span><input value={selectedNode.metadata[field.key] ?? ""} placeholder={field.placeholder} onChange={(event) => updateNode(selectedNode.id, { metadata: { ...selectedNode.metadata, [field.key]: event.target.value } })} /></label>)}</section>
            <section className="inspector-section"><h3>Binding <span>{directBindings.length}</span></h3><button className={`start-binding ${connectionSourceId === selectedNode.id ? "active" : ""}`} onClick={() => setConnectionSourceId((current) => current === selectedNode.id ? null : selectedNode.id)}>{connectionSourceId === selectedNode.id ? "연결 대기 취소" : "＋ 이 Node에서 연결 시작"}</button><div className="binding-list">{directBindings.map((edge) => { const outgoing = edge.sourceId === selectedNode.id; const other = project.nodes.find((node) => node.id === (outgoing ? edge.targetId : edge.sourceId)); return <div key={edge.id}><button onClick={() => other && selectNode(other.id)}><i>{outgoing ? "→" : "←"}</i><span><b>{other?.name ?? "Missing Node"}</b><small>{outgoing ? "Outgoing" : "Incoming"}</small></span></button><div className="binding-controls"><input aria-label="연결 유형" value={edge.bindingType} onChange={(event) => updateBinding(edge.id, { bindingType: event.target.value })} /><select aria-label="CRUD 작업" value={edge.operation} onChange={(event) => updateBinding(edge.id, { operation: event.target.value as CrudOperation })}>{["-", "C", "R", "U", "D", "CR", "RU", "CRUD"].map((operation) => <option key={operation}>{operation}</option>)}</select></div><button onClick={() => deleteBinding(edge.id)} aria-label="연결 삭제">×</button></div>; })}{directBindings.length === 0 && <p>연결된 Object가 없습니다.</p>}</div></section>
            <section className="inspector-section impact-section"><h3>Dependency / Impact <span>{impactNodes.length}</span></h3>{TYPE_ORDER.map((type) => { const items = impactNodes.filter((node) => node.type === type); return items.length > 0 && <div key={type}><span>{TYPE_META[type].label}</span><div>{items.map((node) => <button key={node.id} onClick={() => selectNode(node.id)}>{node.name}</button>)}</div></div>; })}</section>
          </div>
          <footer><button onClick={() => setConnectionSourceId(selectedNode.id)}>연결</button>{selectedNode.type === "page" && <button onClick={() => onOpenPage(selectedNode)}>페이지 편집</button>}<button className="danger" onClick={() => deleteNode(selectedNode.id)}>삭제</button></footer>
        </> : <div className="inspector-empty"><span>INSPECTOR</span><i>⌁</i><h3>Object를 선택하세요</h3><p>속성, 데이터 바인딩, Dependency와 변경 영향 범위를 한곳에서 확인합니다.</p><ul><li>Node 클릭: 전체 관계 강조</li><li>Node 더블 클릭: Page Designer 열기</li><li>Ctrl + K: Object 전체 검색</li></ul></div>}
      </aside>
    </div>

    {searchOpen && <div className="designer-modal-backdrop" onPointerDown={() => setSearchOpen(false)}><section className="search-palette" onPointerDown={(event) => event.stopPropagation()}><header><span>⌕</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Page, Component, DB Field, API, Flow 검색" /><kbd>ESC</kbd></header><div>{searchResults.map((node) => <button key={node.id} onClick={() => { setSelectedId(node.id); setSearchOpen(false); setView(node.type === "page" ? "page" : node.type === "table" || node.type === "field" ? "database" : node.type === "api" ? "api" : "system"); }}><i className={`type-${node.type}`}>{TYPE_META[node.type].icon}</i><span><b>{node.name}</b><small>{TYPE_META[node.type].label} · {nodeSubtitle(node)}</small></span><em>↵</em></button>)}{searchResults.length === 0 && <p>검색 결과가 없습니다.</p>}</div><footer><span><kbd>↑</kbd><kbd>↓</kbd> 탐색</span><span><kbd>Enter</kbd> 선택</span><span>{project.nodes.length} objects</span></footer></section></div>}

    {importOpen && <div className="designer-modal-backdrop" onPointerDown={() => setImportOpen(false)}><section className="json-import-modal" onPointerDown={(event) => event.stopPropagation()}><header><div><span>PROJECT MODEL</span><h2>System Project JSON 가져오기</h2><p>기존 설계를 바꾸기 전에 JSON 구조를 검사합니다.</p></div><button onClick={() => setImportOpen(false)}>×</button></header><textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={'{\n  "version": 1,\n  "name": "Project",\n  "nodes": [],\n  "bindings": []\n}'} /><footer><span>UUID 기반 Node와 Binding 구조</span><button onClick={() => setImportOpen(false)}>취소</button><button className="primary" onClick={importProject}>현재 설계에 적용</button></footer></section></div>}
  </section>;
}
