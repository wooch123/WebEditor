import path from "node:path";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";

const API_PATH = "/editor/api/layouts";
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_LAYOUTS = 200;
const THEME_COLOR_KEYS = ["bg", "sidebar", "panel", "surface", "elevated", "line", "text", "muted", "accent", "accent2", "positive"];

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
  return { name, updatedAt, pages: value.pages, themeId: value.themeId, ...(customTheme ? { customTheme } : {}), fontSize, pagePanelPosition, pagePanelSize };
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
