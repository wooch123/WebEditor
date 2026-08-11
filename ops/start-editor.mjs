import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, request as createProxyRequest } from "node:http";
import { startProdServer } from "vinext/server/prod-server";
import { createSharedLayoutStore } from "./shared-layout-store.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const port = Number.parseInt(process.env.PORT ?? "5173", 10);
const host = process.env.HOST ?? "0.0.0.0";
const storagePath = process.env.LAYOUT_STORE_PATH ?? path.join(projectDir, "data", "shared-layouts.json");

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT ?? ""}`);
}

const application = await startProdServer({
  port: 0,
  host: "127.0.0.1",
  outDir: path.join(projectDir, "dist"),
  rscEntryPath: path.join(scriptDir, "vinext-editor-entry.mjs"),
  silent: true,
});

const sharedLayouts = createSharedLayoutStore(storagePath);

function proxyToApplication(request, response) {
  const proxy = createProxyRequest({
    hostname: "127.0.0.1",
    port: application.port,
    path: request.url ?? "/",
    method: request.method,
    headers: request.headers,
  }, (proxyResponse) => {
    response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
    proxyResponse.pipe(response);
  });
  proxy.on("error", (error) => {
    console.error("[Layout Lab] Application proxy error:", error);
    if (!response.headersSent) response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    response.end("Application server is unavailable");
  });
  request.pipe(proxy);
}

const server = createServer((request, response) => {
  sharedLayouts.handle(request, response).then((handled) => {
    if (!handled) proxyToApplication(request, response);
  }).catch((error) => {
    console.error("[Layout Lab] Request handling error:", error);
    if (!response.headersSent) response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("Internal Server Error");
  });
});

await new Promise((resolve) => server.listen(port, host, resolve));
console.log(`[Layout Lab] Server running at http://${host}:${port}/editor/`);
console.log(`[Layout Lab] Shared layouts: ${sharedLayouts.storagePath}`);

function shutdown() {
  server.close(() => application.server.close(() => process.exit(0)));
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
