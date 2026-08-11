import path from "node:path";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";

const API_PATH = "/editor/api/layouts";
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_LAYOUTS = 200;
const THEME_COLOR_KEYS = ["bg", "sidebar", "panel", "surface", "elevated", "line", "text", "muted", "accent", "accent2", "positive"];
const SYSTEM_NODE_TYPES = new Set(["page", "component", "api", "logic", "table", "field", "flow", "role", "storage", "external"]);

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store, max-age=0",
    "x-content-type-options": "nosniff",
  });
  response.end(body);
}

async function readJsonBody(request) {
  const chunks = [];
  let received = 0;
  for await (const chunk of request) {
    received += chunk.length;
    if (received > MAX_BODY_BYTES) throw Object.assign(new Error("저장 데이터가 너무 큽니다."), { status: 413 });
    chunks.push(chunk);
  }
  if (chunks.length === 0) throw Object.assign(new Error("저장할 데이터가 없습니다."), { status: 400 });
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("올바른 JSON 데이터가 아닙니다."), { status: 400 });
  }
}

function normalizeCustomTheme(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("커스텀 테마 데이터가 올바르지 않습니다."), { status: 400 });
  const theme = {
    id: "custom",
    name: "Custom Theme",
    mode: value.mode === "light" ? "light" : "dark",
  };
  for (const key of THEME_COLOR_KEYS) {
    const color = typeof value[key] === "string" ? value[key].trim() : "";
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw Object.assign(new Error(`커스텀 테마의 ${key} 색상값이 올바르지 않습니다.`), { status: 400 });
    theme[key] = color.toLowerCase();
  }
  return theme;
}

function normalizeStringRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, 100).map(([key, item]) => [String(key).slice(0, 100), typeof item === "string" ? item.slice(0, 10000) : String(item ?? "").slice(0, 10000)]));
}

function normalizeSystemProject(value) {
  if (value == null) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 1) throw Object.assign(new Error("시스템 설계 프로젝트 형식이 올바르지 않습니다."), { status: 400 });
  if (!Array.isArray(value.nodes) || value.nodes.length > 2000 || !Array.isArray(value.bindings) || value.bindings.length > 10000) throw Object.assign(new Error("시스템 설계 Node 또는 연결 데이터가 올바르지 않습니다."), { status: 400 });
  const nodes = value.nodes.map((node, index) => {
    if (!node || typeof node !== "object" || Array.isArray(node) || !SYSTEM_NODE_TYPES.has(node.type)) throw Object.assign(new Error(`시스템 설계 Node ${index + 1}의 형식이 올바르지 않습니다.`), { status: 400 });
    const id = typeof node.id === "string" ? node.id.trim().slice(0, 200) : "";
    const name = typeof node.name === "string" ? node.name.trim().slice(0, 300) : "";
    if (!id || !name) throw Object.assign(new Error(`시스템 설계 Node ${index + 1}의 ID 또는 이름이 없습니다.`), { status: 400 });
    return {
      id,
      type: node.type,
      name,
      description: typeof node.description === "string" ? node.description.slice(0, 10000) : "",
      x: Number.isFinite(Number(node.x)) ? Math.max(0, Math.min(10000, Number(node.x))) : 0,
      y: Number.isFinite(Number(node.y)) ? Math.max(0, Math.min(10000, Number(node.y))) : 0,
      ...(typeof node.parentId === "string" && node.parentId ? { parentId: node.parentId.slice(0, 200) } : {}),
      metadata: normalizeStringRecord(node.metadata),
    };
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (nodeIds.size !== nodes.length) throw Object.assign(new Error("시스템 설계 Node ID가 중복되었습니다."), { status: 400 });
  const bindings = value.bindings.map((binding, index) => {
    if (!binding || typeof binding !== "object" || Array.isArray(binding)) throw Object.assign(new Error(`시스템 설계 연결 ${index + 1}의 형식이 올바르지 않습니다.`), { status: 400 });
    const id = typeof binding.id === "string" ? binding.id.trim().slice(0, 200) : "";
    const sourceId = typeof binding.sourceId === "string" ? binding.sourceId.trim().slice(0, 200) : "";
    const targetId = typeof binding.targetId === "string" ? binding.targetId.trim().slice(0, 200) : "";
    if (!id || !nodeIds.has(sourceId) || !nodeIds.has(targetId)) throw Object.assign(new Error(`시스템 설계 연결 ${index + 1}의 대상 Node가 올바르지 않습니다.`), { status: 400 });
    const operation = typeof binding.operation === "string" && /^(?:-|[CRUD]{1,4})$/.test(binding.operation) ? binding.operation : "-";
    return {
      id,
      sourceId,
      targetId,
      bindingType: typeof binding.bindingType === "string" && binding.bindingType.trim() ? binding.bindingType.trim().slice(0, 100) : "DEPENDENCY",
      operation,
      ...(typeof binding.label === "string" && binding.label ? { label: binding.label.slice(0, 300) } : {}),
      ...(binding.metadata ? { metadata: normalizeStringRecord(binding.metadata) } : {}),
    };
  });
  return {
    version: 1,
    id: typeof value.id === "string" && value.id.trim() ? value.id.trim().slice(0, 200) : "system-project",
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim().slice(0, 300) : "System Project",
    description: typeof value.description === "string" ? value.description.slice(0, 10000) : "",
    updatedAt: Number.isFinite(Number(value.updatedAt)) ? Number(value.updatedAt) : Date.now(),
    nodes,
    bindings,
  };
}

function normalizeLayout(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("레이아웃 형식이 올바르지 않습니다."), { status: 400 });
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name || name.length > 100) throw Object.assign(new Error("레이아웃 이름은 1~100자로 입력해 주세요."), { status: 400 });
  if (!Array.isArray(value.pages) || value.pages.length === 0 || value.pages.length > 100) throw Object.assign(new Error("페이지 데이터가 올바르지 않습니다."), { status: 400 });
  if (typeof value.themeId !== "string" || value.themeId.length > 100) throw Object.assign(new Error("테마 데이터가 올바르지 않습니다."), { status: 400 });
  const updatedAt = Number.isFinite(Number(value.updatedAt)) ? Number(value.updatedAt) : Date.now();
  const fontSize = Number.isFinite(Number(value.fontSize)) ? Math.max(8, Math.min(15, Number(value.fontSize))) : 13;
  const pagePanelPosition = value.pagePanelPosition === "top" || value.pagePanelPosition === "right" ? value.pagePanelPosition : "left";
  const rawPagePanelSize = Number(value.pagePanelSize);
  const pagePanelSize = Number.isFinite(rawPagePanelSize) ? Math.max(200, Math.min(420, Math.round(rawPagePanelSize))) : 236;
  const customTheme = value.themeId === "custom" ? normalizeCustomTheme(value.customTheme) : undefined;
  const workspaceMode = value.workspaceMode === "system" ? "system" : "layout";
  const systemProject = normalizeSystemProject(value.systemProject);
  return { name, updatedAt, pages: value.pages, themeId: value.themeId, ...(customTheme ? { customTheme } : {}), fontSize, pagePanelPosition, pagePanelSize, workspaceMode, ...(systemProject ? { systemProject } : {}) };
}

export function createSharedLayoutStore(storagePath) {
  const resolvedPath = path.resolve(storagePath);
  let writeQueue = Promise.resolve();

  const readLayouts = async () => {
    try {
      const source = await readFile(resolvedPath, "utf8");
      const parsed = JSON.parse(source);
      if (!parsed || !Array.isArray(parsed.layouts)) throw new Error("공유 레이아웃 저장소 형식이 올바르지 않습니다.");
      return parsed.layouts.map(normalizeLayout).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
  };

  const writeLayouts = async (layouts) => {
    await mkdir(path.dirname(resolvedPath), { recursive: true });
    const temporaryPath = `${resolvedPath}.${process.pid}.${Date.now()}.tmp`;
    try {
      await writeFile(temporaryPath, JSON.stringify({ version: 1, layouts }, null, 2), "utf8");
      await rename(temporaryPath, resolvedPath);
    } catch (error) {
      await unlink(temporaryPath).catch(() => {});
      throw error;
    }
  };

  const queueWrite = (work) => {
    const result = writeQueue.then(work, work);
    writeQueue = result.catch(() => {});
    return result;
  };

  const handle = async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname.replace(/\/+$/, "") !== API_PATH) return false;

    try {
      if (request.method === "GET" || request.method === "HEAD") {
        await writeQueue;
        const layouts = await readLayouts();
        if (request.method === "HEAD") {
          response.writeHead(200, { "cache-control": "no-store, max-age=0" });
          response.end();
        } else sendJson(response, 200, { layouts });
        return true;
      }

      if (request.method === "PUT") {
        const layout = normalizeLayout(await readJsonBody(request));
        const layouts = await queueWrite(async () => {
          const current = await readLayouts();
          const next = [layout, ...current.filter((item) => item.name !== layout.name)].slice(0, MAX_LAYOUTS);
          await writeLayouts(next);
          return next;
        });
        sendJson(response, 200, { layout, layouts });
        return true;
      }

      if (request.method === "DELETE") {
        const name = (url.searchParams.get("name") ?? "").trim();
        if (!name) throw Object.assign(new Error("삭제할 레이아웃 이름이 필요합니다."), { status: 400 });
        const layouts = await queueWrite(async () => {
          const current = await readLayouts();
          const next = current.filter((item) => item.name !== name);
          if (next.length === current.length) throw Object.assign(new Error("레이아웃을 찾을 수 없습니다."), { status: 404 });
          await writeLayouts(next);
          return next;
        });
        sendJson(response, 200, { layouts });
        return true;
      }

      response.setHeader("allow", "GET, HEAD, PUT, DELETE");
      sendJson(response, 405, { error: "지원하지 않는 요청 방식입니다." });
      return true;
    } catch (error) {
      console.error("[Layout Lab] Shared layout API error:", error);
      sendJson(response, Number(error?.status) || 500, { error: Number(error?.status) ? error.message : "서버 저장소 처리 중 오류가 발생했습니다." });
      return true;
    }
  };

  return { handle, storagePath: resolvedPath };
}
