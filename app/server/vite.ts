import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html"
      );

      if (!fs.existsSync(clientTemplate)) {
        throw new Error(`Could not find template at ${clientTemplate}`);
      }

      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "client");
  console.log('Serving static files from:', distPath);

  if (!fs.existsSync(distPath)) {
    console.error(`Build directory not found: ${distPath}`);
    throw new Error(`Could not find the build directory: ${distPath}`);
  }

  // Serve static files
  app.use(express.static(distPath, {
    index: false // Don't serve index.html for /
  }));

  // Handle client-side routing
  app.get("/*", (req, res, next) => {
    // Skip API routes
    if (req.url.startsWith("/api")) {
      return next();
    }

    // Serve index.html for all other routes
    const indexPath = path.join(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      console.error(`index.html not found in: ${indexPath}`);
      return next(new Error(`Could not find index.html in ${distPath}`));
    }
    res.sendFile(indexPath);
  });
}