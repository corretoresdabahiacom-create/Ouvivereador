import http from "http";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
// Import the native worker entrypoint
import { onRequest } from "./functions/api/[[path]]";

const PORT = 3000;

async function start() {
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false },
    appType: "spa",
  });

  const server = http.createServer(async (req, res) => {
    const url = req.url || "";

    // Intercept any backend API request
    if (url.startsWith("/api/")) {
      try {
        const method = req.method || "GET";
        const headers = new Headers();
        Object.entries(req.headers).forEach(([k, v]) => {
          if (v) {
            if (Array.isArray(v)) {
              v.forEach((val) => headers.append(k, val));
            } else {
              headers.append(k, v);
            }
          }
        });

        // Parse Request Body Stream
        let body: Buffer | undefined = undefined;
        if (method !== "GET" && method !== "HEAD") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }
          if (chunks.length > 0) {
            body = Buffer.concat(chunks);
          }
        }

        const PROTO = req.headers["x-forwarded-proto"] || "http";
        const HOST = req.headers["host"] || `localhost:${PORT}`;
        const fullUrl = `${PROTO}://${HOST}${url}`;

        const webReq = new Request(fullUrl, {
          method,
          headers,
          body,
          duplex: body ? "half" : undefined,
        } as any);

        // Build mock Cloudflare environment context with serverless KV emulator saving to data/db.json
        const env = {
          GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
          OUVIDORIA_DB: {
            get: async (key: string) => {
              const dbFile = path.join(process.cwd(), "data", "db.json");
              if (fs.existsSync(dbFile)) {
                return fs.readFileSync(dbFile, "utf-8");
              }
              return null;
            },
            put: async (key: string, val: string) => {
              const dbDir = path.join(process.cwd(), "data");
              if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
              }
              const dbFile = path.join(dbDir, "db.json");
              fs.writeFileSync(dbFile, val, "utf-8");
            },
          },
        };

        const context = {
          request: webReq,
          env,
          params: {},
          waitUntil: (promise: Promise<any>) => {},
          next: () => Promise.resolve(new Response("Not found", { status: 404 })),
        };

        // Dispatch directly into Cloudflare Pages Function onRequest handler
        const webRes = await onRequest(context as any);

        // Map web Response headers and status back to raw Node response
        res.statusCode = webRes.status;
        webRes.headers.forEach((v, k) => {
          res.setHeader(k, v);
        });

        const responseBody = await webRes.arrayBuffer();
        res.end(Buffer.from(responseBody));
      } catch (err: any) {
        console.error("Local cloudflare worker emulation error:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            success: false,
            message: "Erro no emulador Cloudflare: " + err.message,
          })
        );
      }
    } else {
      // Fallback: let Vite serve the SPA static index.html and JS bundles
      vite.middlewares(req, res);
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Cloudflare Dev Emulator] Rodando na porta ${PORT}`);
  });
}

start().catch(console.error);
