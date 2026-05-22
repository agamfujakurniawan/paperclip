import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import httpProxy from "http-proxy";
import pg from "pg";

const PUBLIC_PORT = Number.parseInt(process.env.PORT ?? "3100", 10);
const INTERNAL_PORT = Number.parseInt(process.env.INTERNAL_PAPERCLIP_PORT ?? "3199", 10);
const INTERNAL_HOST = "127.0.0.1";
const APP_ROOT = "/app";
const PAPERCLIP_TARGET = `http://${INTERNAL_HOST}:${INTERNAL_PORT}`;

const { Client } = pg;
const ONBOARDED_CACHE_TTL_MS = 5 * 60 * 1000;
const NOT_ONBOARDED_CACHE_MS = 10 * 1000;

let paperclipProc = null;
let onboardedCache = { value: null, at: 0 };

function railwayPublicUrl() {
  const explicit = process.env.PAPERCLIP_PUBLIC_URL ?? process.env.BETTER_AUTH_BASE_URL;
  if (explicit?.trim() && !explicit.includes("${{")) return explicit.trim().replace(/\/+$/, "");
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  return railwayDomain ? `https://${railwayDomain}` : null;
}

function paperclipChildEnv() {
  const publicUrl = railwayPublicUrl();
  return {
    ...process.env,
    HOST: INTERNAL_HOST,
    PORT: String(INTERNAL_PORT),
    PAPERCLIP_OPEN_ON_LISTEN: "false",
    ...(publicUrl && !process.env.PAPERCLIP_PUBLIC_URL ? { PAPERCLIP_PUBLIC_URL: publicUrl } : {}),
    ...(publicUrl && !process.env.BETTER_AUTH_BASE_URL ? { BETTER_AUTH_BASE_URL: publicUrl } : {}),
  };
}

function startPaperclip() {
  if (paperclipProc) return;
  paperclipProc = spawn("tsx", ["server/dist/index.js"], {
    cwd: APP_ROOT,
    env: paperclipChildEnv(),
    stdio: "inherit",
  });
  paperclipProc.on("exit", (code, signal) => {
    console.error(`[paperclip] exited code=${code} signal=${signal}`);
    paperclipProc = null;
    setTimeout(startPaperclip, 2000);
  });
}

async function isPaperclipReady() {
  try {
    const res = await fetch(`${PAPERCLIP_TARGET}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function hasInstanceAdmin() {
  const now = Date.now();
  if (onboardedCache.value === true && now - onboardedCache.at < ONBOARDED_CACHE_TTL_MS) {
    return true;
  }
  if (onboardedCache.value === false && now - onboardedCache.at < NOT_ONBOARDED_CACHE_MS) {
    return false;
  }

  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    onboardedCache = { value: false, at: now };
    return false;
  }

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const result = await client.query(
      "SELECT COUNT(*)::int AS count FROM instance_user_roles WHERE role = $1",
      ["instance_admin"],
    );
    const ok = (result.rows[0]?.count ?? 0) > 0;
    onboardedCache = { value: ok, at: now };
    return ok;
  } catch {
    onboardedCache = { value: false, at: now };
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function setupHtml() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Paperclip Setup</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Inter, system-ui, -apple-system, sans-serif; background:#0d0d0d; color:#d8d8d8; margin:0; padding:32px; line-height:1.5; }
      .card { max-width:760px; margin:0 auto; background:#141414; border:1px solid #2d2d2d; border-radius:12px; padding:32px; }
      h1 { margin:0 0 8px; font-size:24px; color:#fff; }
      .sub, .muted { color:#9ca3af; font-size:14px; }
      .step { margin-top:24px; padding-top:20px; border-top:1px solid #2d2d2d; }
      .step-title { font-size:16px; font-weight:600; color:#fff; margin-bottom:6px; }
      .row { margin:12px 0; }
      button { background:#262626; color:#fff; border:1px solid #404040; border-radius:8px; padding:10px 16px; font-size:14px; cursor:pointer; }
      button:hover:not(:disabled) { background:#2d2d2d; }
      button:disabled { opacity:0.6; cursor:not-allowed; }
      code, pre, .block { background:#1a1a1a; border:1px solid #2d2d2d; border-radius:8px; padding:2px 6px; }
      pre, .block { display:block; padding:12px 14px; overflow:auto; white-space:pre-wrap; word-break:break-word; }
      a { color:#a5b4fc; text-decoration:none; }
      a:hover { text-decoration:underline; }
      .status { display:flex; flex-direction:column; gap:8px; margin:12px 0; }
      .pill { background:#1a1a1a; border:1px solid #2d2d2d; border-left:3px solid #525252; border-radius:8px; padding:10px 14px; font-size:13px; }
      .pill.ok { border-left-color:#22c55e; color:#86efac; }
      .pill.warn { border-left-color:#f59e0b; color:#fcd34d; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Paperclip Setup</h1>
      <p class="sub">Railway wrapper is running. Paperclip data is persisted under <code>/paperclip</code>.</p>
      <div class="row muted">Paperclip health: <strong id="health">checking...</strong></div>

      <div class="step">
        <div class="step-title">AI adapter status</div>
        <p class="muted">Set keys in Railway variables. Codex OpenAI mode can use the login button; ModelArk uses <code>ARK_API_KEY</code> through the adapter provider config.</p>
        <div class="status">
          <div class="pill" id="codexStatus">Codex: checking...</div>
          <div class="pill" id="modelarkStatus">ModelArk: checking...</div>
          <div class="pill" id="claudeStatus">Claude: checking...</div>
        </div>
        <div class="row"><button id="codexLogin" type="button">Run Codex OpenAI login</button></div>
        <pre id="codexOutput" style="display:none;">-</pre>
      </div>

      <div class="step">
        <div class="step-title">Create first admin invite</div>
        <p class="muted">Generate a one-time invite URL and open it to create the first instance admin.</p>
        <button id="bootstrap" type="button">Generate admin invite URL</button>
        <div class="row" id="inviteRow" style="display:none;">
          <a id="invite" href="#" target="_blank" rel="noopener" class="block"></a>
        </div>
        <pre id="output">-</pre>
      </div>

      <div class="step muted">After accepting the invite, open <a href="/" target="_blank">Paperclip app</a>.</div>
    </div>
    <script>
      const healthEl = document.getElementById("health");
      const outputEl = document.getElementById("output");
      const inviteEl = document.getElementById("invite");
      const inviteRow = document.getElementById("inviteRow");
      const bootstrapBtn = document.getElementById("bootstrap");
      const codexBtn = document.getElementById("codexLogin");
      const codexOutput = document.getElementById("codexOutput");
      const codexStatus = document.getElementById("codexStatus");
      const modelarkStatus = document.getElementById("modelarkStatus");
      const claudeStatus = document.getElementById("claudeStatus");

      function setStatus(el, ok, text) {
        el.className = ok ? "pill ok" : "pill warn";
        el.textContent = text;
      }

      async function refreshHealth() {
        try {
          const res = await fetch("/setup/api/status");
          const json = await res.json();
          healthEl.textContent = json.paperclipReady ? "ready" : "starting";
        } catch {
          healthEl.textContent = "unreachable";
        }
      }

      async function refreshAiStatus() {
        try {
          const res = await fetch("/setup/api/ai-status");
          const json = await res.json();
          setStatus(codexStatus, json.codex?.codexAuthenticated, json.codex?.codexAuthenticated ? "Codex OpenAI: authenticated" : (json.codex?.openaiApiKeySet ? "Codex OpenAI: key set, run login" : "Codex OpenAI: set OPENAI_API_KEY if needed"));
          setStatus(modelarkStatus, json.modelark?.arkApiKeySet, json.modelark?.arkApiKeySet ? "ModelArk: ARK_API_KEY set" : "ModelArk: set ARK_API_KEY if using ModelArk");
          setStatus(claudeStatus, json.claude?.anthropicApiKeySet, json.claude?.anthropicApiKeySet ? "Claude: ANTHROPIC_API_KEY set" : "Claude: set ANTHROPIC_API_KEY if needed");
        } catch {
          setStatus(codexStatus, false, "Codex: status unavailable");
          setStatus(modelarkStatus, false, "ModelArk: status unavailable");
          setStatus(claudeStatus, false, "Claude: status unavailable");
        }
      }

      bootstrapBtn.onclick = async () => {
        bootstrapBtn.disabled = true;
        outputEl.textContent = "Generating invite...";
        inviteRow.style.display = "none";
        try {
          const res = await fetch("/setup/api/bootstrap", { method: "POST" });
          const json = await res.json();
          outputEl.textContent = json.output || JSON.stringify(json, null, 2);
          if (json.inviteUrl) {
            inviteEl.href = json.inviteUrl;
            inviteEl.textContent = json.inviteUrl;
            inviteRow.style.display = "block";
          }
        } catch (err) {
          outputEl.textContent = String(err);
        } finally {
          bootstrapBtn.disabled = false;
          refreshHealth();
        }
      };

      codexBtn.onclick = async () => {
        codexBtn.disabled = true;
        codexOutput.style.display = "block";
        codexOutput.textContent = "Running codex login...";
        try {
          const res = await fetch("/setup/api/codex-login", { method: "POST" });
          const json = await res.json();
          codexOutput.textContent = json.output || JSON.stringify(json, null, 2);
          await refreshAiStatus();
        } catch (err) {
          codexOutput.textContent = String(err);
        } finally {
          codexBtn.disabled = false;
        }
      };

      refreshHealth();
      refreshAiStatus();
      setInterval(refreshHealth, 5000);
      setInterval(refreshAiStatus, 10000);
    </script>
  </body>
</html>`;
}

function buildBaseUrl(req) {
  const fromEnv = railwayPublicUrl();
  if (fromEnv) return fromEnv;
  const proto = req.headers["x-forwarded-proto"] ?? "http";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? `localhost:${PUBLIC_PORT}`;
  return `${proto}://${host}`.replace(/\/+$/, "");
}

function runBootstrap(baseUrl) {
  return new Promise((resolve) => {
    const child = spawn("node", ["/wrapper/template/bootstrap-ceo.mjs"], {
      cwd: "/wrapper",
      env: {
        ...process.env,
        BETTER_AUTH_BASE_URL: baseUrl,
        PAPERCLIP_PUBLIC_URL: baseUrl,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    child.stdout.on("data", (chunk) => { out += chunk.toString(); });
    child.stderr.on("data", (chunk) => { out += chunk.toString(); });
    child.on("close", (code) => {
      const inviteMatch = out.match(/https?:\/\/[^\s]+\/invite\/[^\s]+/);
      resolve({
        ok: code === 0 || out.includes("instance admin already exists"),
        inviteUrl: inviteMatch ? inviteMatch[0] : null,
        output: out.trim(),
      });
    });
  });
}

function runCodexLogin() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return Promise.resolve({
      ok: false,
      output: "OPENAI_API_KEY is not set. Add it in Railway variables, then run this again.",
    });
  }
  return new Promise((resolve) => {
    const child = spawn("codex", ["login", "--with-api-key"], {
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => { out += chunk.toString(); });
    child.stderr.on("data", (chunk) => { err += chunk.toString(); });
    child.on("close", (code) => {
      const combined = [out.trim(), err.trim()].filter(Boolean).join("\n") || "(no output)";
      resolve({ ok: code === 0, output: combined });
    });
    child.on("error", (error) => {
      resolve({ ok: false, output: `Failed to run codex: ${error.message}` });
    });
    child.stdin.write(apiKey, "utf8", () => child.stdin.end());
  });
}

function getCodexStatus() {
  const codexHome = process.env.CODEX_HOME || path.join(process.env.HOME || "/home/node", ".codex");
  const authPath = path.join(codexHome, "auth.json");
  return {
    codexAuthenticated: fs.existsSync(authPath),
    openaiApiKeySet: Boolean(process.env.OPENAI_API_KEY?.trim()),
  };
}

function getModelArkStatus() {
  return { arkApiKeySet: Boolean(process.env.ARK_API_KEY?.trim()) };
}

function getClaudeStatus() {
  return { anthropicApiKeySet: Boolean(process.env.ANTHROPIC_API_KEY?.trim()) };
}

const app = express();
const proxy = httpProxy.createProxyServer({
  target: PAPERCLIP_TARGET,
  ws: true,
  changeOrigin: false,
});

proxy.on("proxyReq", (proxyReq, req) => {
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const proto = req.headers["x-forwarded-proto"] ?? (req.socket?.encrypted ? "https" : "http");
  if (host) proxyReq.setHeader("x-forwarded-host", host);
  proxyReq.setHeader("x-forwarded-proto", proto);
});

proxy.on("error", (_err, req, res) => {
  if (!res) return;
  if (typeof res.writeHead === "function" && !res.headersSent) {
    res.writeHead(503, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "paperclip_unavailable", path: req.url }));
    return;
  }
  if (typeof res.destroy === "function") res.destroy();
});

app.get("/setup", (_req, res) => {
  res.status(200).type("html").send(setupHtml());
});

app.get("/setup/healthz", async (_req, res) => {
  const ready = await isPaperclipReady();
  res.status(200).json({ ok: true, wrapper: "ready", paperclipReady: ready });
});

app.get("/setup/api/status", async (_req, res) => {
  const ready = await isPaperclipReady();
  res.status(200).json({ ok: true, paperclipReady: ready, target: PAPERCLIP_TARGET });
});

app.post("/setup/api/bootstrap", async (req, res) => {
  const result = await runBootstrap(buildBaseUrl(req));
  res.status(result.ok ? 200 : 500).json(result);
});

app.get("/setup/api/codex-status", (_req, res) => {
  res.status(200).json(getCodexStatus());
});

app.get("/setup/api/ai-status", (_req, res) => {
  res.status(200).json({
    codex: getCodexStatus(),
    modelark: getModelArkStatus(),
    claude: getClaudeStatus(),
  });
});

app.post("/setup/api/codex-login", async (_req, res) => {
  const result = await runCodexLogin();
  res.status(result.ok ? 200 : 400).json(result);
});

app.use(async (req, res, next) => {
  const requestPath = (req.path || "/").replace(/\/+$/, "") || "/";
  if (req.method !== "GET" || requestPath !== "/") return next();
  const ready = await isPaperclipReady();
  if (!ready) {
    res.redirect(302, "/setup");
    return;
  }
  const onboarded = await hasInstanceAdmin();
  if (!onboarded) {
    res.redirect(302, "/setup");
    return;
  }
  next();
});

app.use((req, res) => {
  proxy.web(req, res);
});

const server = app.listen(PUBLIC_PORT, () => {
  console.log(`[wrapper] listening on ${PUBLIC_PORT}, proxying to ${PAPERCLIP_TARGET}`);
});

server.on("upgrade", (req, socket, head) => {
  proxy.ws(req, socket, head);
});

startPaperclip();

if (process.env.OPENAI_API_KEY?.trim()) {
  runCodexLogin()
    .then((result) => {
      if (result.ok) console.log("[wrapper] Codex login succeeded (OPENAI_API_KEY)");
      else console.warn("[wrapper] Codex login failed:", result.output);
    })
    .catch((error) => console.warn("[wrapper] Codex login error:", error.message));
}

const shutdown = () => {
  if (paperclipProc) paperclipProc.kill("SIGTERM");
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
