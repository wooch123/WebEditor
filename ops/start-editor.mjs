import path from "node:path";
import { fileURLToPath } from "node:url";
import { startProdServer } from "vinext/server/prod-server";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const port = Number.parseInt(process.env.PORT ?? "5173", 10);
const host = process.env.HOST ?? "0.0.0.0";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT ?? ""}`);
}

await startProdServer({
  port,
  host,
  outDir: path.join(projectDir, "dist"),
  rscEntryPath: path.join(scriptDir, "vinext-editor-entry.mjs"),
});
