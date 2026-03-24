import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

const firebaseConfig = JSON.parse(readFileSync(join(process.cwd(), "firebase-applet-config.json"), "utf8"));

dotenv.config();

// Initialize Firebase Admin
try {
  if (!getApps().length) {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log("Firebase Admin initialized for project:", firebaseConfig.projectId);
  }
} catch (fbError) {
  console.error("Firebase Admin initialization error:", fbError);
}

async function startServer() {
  try {
    console.log("Starting server with database:", firebaseConfig.firestoreDatabaseId);
    const db = getFirestore(firebaseConfig.firestoreDatabaseId);
    const app = express();
    const PORT = 3000;

    app.use(express.json());
    app.use(cookieParser());

    // Dynamic Hosting Route (Built-in Hosting)
    app.get("/v/:slug", async (req, res) => {
      const { slug } = req.params;
      
      try {
        const sitesRef = db.collection("sites");
        const snapshot = await sitesRef.where("slug", "==", slug).limit(1).get();
        
        if (snapshot.empty) {
          return res.status(404).send("<h1>Site Not Found</h1><p>The requested website does not exist or has not been published.</p>");
        }

        const siteData = snapshot.docs[0].data();
        
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${siteData.title}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
              <style>
                body { font-family: '${siteData.theme.fontFamily}', sans-serif; margin: 0; padding: 0; }
                :root { --primary: ${siteData.theme.primaryColor}; --secondary: ${siteData.theme.secondaryColor}; }
              </style>
            </head>
            <body>
              ${siteData.html}
            </body>
          </html>
        `);
      } catch (error) {
        console.error("Hosting Error:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Health check
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok" });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      console.log("Initializing Vite server...");
      try {
        const vite = await createViteServer({
          server: { 
            middlewareMode: true,
            hmr: false // Explicitly disable HMR to avoid port conflicts
          },
          appType: "spa",
        });
        app.use(vite.middlewares);
        console.log("Vite middleware attached.");
      } catch (viteError) {
        console.error("Vite initialization failed:", viteError);
      }
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. This might happen during hot-reloads.`);
      } else {
        console.error('Server listen error:', err);
      }
    });
  } catch (error) {
    console.error("CRITICAL STARTUP ERROR:", error);
    // Do not exit, let the environment handle restarts if possible
  }
}

startServer();
