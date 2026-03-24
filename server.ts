import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI } from "@google/genai";
import path from "path";

const db = new Database("threat_intel.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS threat_actors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    aliases TEXT,
    origin TEXT,
    description TEXT,
    targets TEXT,
    techniques TEXT,
    last_active DATE
  );

  CREATE TABLE IF NOT EXISTS ioc_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    status TEXT,
    analysis TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS threat_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trend_name TEXT NOT NULL,
    description TEXT,
    impact_level TEXT,
    frequency INTEGER
  );
`);

// Seed initial data if empty
const actorCount = db.prepare("SELECT count(*) as count FROM threat_actors").get() as { count: number };
if (actorCount.count === 0) {
  const insertActor = db.prepare("INSERT INTO threat_actors (name, origin, description, targets, techniques) VALUES (?, ?, ?, ?, ?)");
  insertActor.run("Lazarus Group", "North Korea", "State-sponsored cyber warfare group active since at least 2009.", "Financial institutions, cryptocurrency exchanges, media", "Spear-phishing, custom malware, watering hole attacks");
  insertActor.run("Fancy Bear (APT28)", "Russia", "Cyber espionage group associated with the GRU.", "Government, military, security organizations", "Zero-day exploits, credential harvesting, X-Agent malware");
  insertActor.run("Wizard Spider", "Russia/Eastern Europe", "Financially motivated criminal group behind Ryuk and Conti ransomware.", "Healthcare, education, government", "Ransomware-as-a-Service, TrickBot, Emotet");

  const insertTrend = db.prepare("INSERT INTO threat_trends (trend_name, description, impact_level, frequency) VALUES (?, ?, ?, ?)");
  insertTrend.run("Ransomware 2.0", "Double extortion tactics involving data exfiltration before encryption.", "Critical", 85);
  insertTrend.run("Supply Chain Attacks", "Targeting software vendors to compromise downstream customers.", "High", 60);
  insertTrend.run("AI-Enhanced Phishing", "Using LLMs to create highly convincing and personalized phishing emails.", "Medium", 45);

  const insertIOC = db.prepare("INSERT INTO ioc_history (type, value, status, analysis) VALUES (?, ?, ?, ?)");
  insertIOC.run("IP", "192.168.1.105", "Malicious", "Associated with known C2 infrastructure used by Lazarus Group.");
  insertIOC.run("Domain", "secure-update-microsoft.com", "Suspicious", "Domain registered recently with high entropy, mimicking official Microsoft update service.");
  insertIOC.run("Hash", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "Clean", "Known safe system file hash (empty file).");
  insertIOC.run("IP", "45.33.22.11", "Malicious", "Flagged for active scanning and brute-force attempts against SSH ports.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/actors", (req, res) => {
    const actors = db.prepare("SELECT * FROM threat_actors").all();
    res.json(actors);
  });

  app.get("/api/trends", (req, res) => {
    const trends = db.prepare("SELECT * FROM threat_trends").all();
    res.json(trends);
  });

  app.get("/api/dashboard-stats", (req, res) => {
    const actorCount = db.prepare("SELECT count(*) as count FROM threat_actors").get() as { count: number };
    const iocCount = db.prepare("SELECT count(*) as count FROM ioc_history").get() as { count: number };
    const maliciousIocs = db.prepare("SELECT count(*) as count FROM ioc_history WHERE status = 'Malicious'").get() as { count: number };
    
    res.json({
      totalActors: actorCount.count,
      totalIocsAnalyzed: iocCount.count,
      maliciousIocs: maliciousIocs.count,
      activeAlerts: 12 // Mocked for dashboard feel
    });
  });

  app.get("/api/ioc-history", (req, res) => {
    const history = db.prepare("SELECT * FROM ioc_history ORDER BY created_at DESC LIMIT 10").all();
    res.json(history);
  });

  app.post("/api/save-ioc", (req, res) => {
    const { type, value, status, analysis } = req.body;
    const info = db.prepare("INSERT INTO ioc_history (type, value, status, analysis) VALUES (?, ?, ?, ?)").run(type, value, status, analysis);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
