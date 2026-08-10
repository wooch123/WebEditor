import handler from "../dist/server/index.js";

// The Cloudflare-oriented production bundle exposes only its default worker.
// Re-export the path metadata Vinext's Ubuntu/Node server needs to serve assets.
export const __basePath = "/editor";
export const __assetPrefix = "/editor";

export default handler;
