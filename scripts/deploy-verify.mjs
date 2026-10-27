const requestedUrl = process.env.DEPLOY_VERIFY_URL || process.argv[2];

if (!requestedUrl) {
  console.error("Usage: DEPLOY_VERIFY_URL=https://your-app.example npm run deploy:verify");
  process.exit(1);
}

let baseUrl;
try {
  baseUrl = new URL(requestedUrl);
  if (!/^https?:$/.test(baseUrl.protocol)) throw new Error("The URL must use HTTP or HTTPS.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "The deployment URL is invalid.");
  process.exit(1);
}

const checks = [];

async function check(path, validate) {
  const url = new URL(path, baseUrl);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: "error" });
    const body = await response.text();
    const result = validate(response, body);
    checks.push({ path, status: response.status, ok: response.ok && result.ok, detail: result.detail });
  } catch (error) {
    checks.push({ path, status: null, ok: false, detail: error instanceof Error ? error.message : "Request failed." });
  }
}

await check("/api/health", (_response, body) => {
  try {
    const health = JSON.parse(body);
    const ok = health.ok === true && health.status === "ready" && health.strict === true && Array.isArray(health.missingConfiguration) && health.missingConfiguration.length === 0;
    return { ok, detail: ok ? "strict healthcheck ready" : "healthcheck is not ready" };
  } catch {
    return { ok: false, detail: "healthcheck did not return JSON" };
  }
});

await check("/manifest.webmanifest", (_response, body) => {
  try {
    const manifest = JSON.parse(body);
    const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
    const ok = manifest.display === "standalone" && manifest.start_url === "/" && manifest.scope === "/" && icons.length >= 2 && icons.every((icon) => icon.type === "image/png");
    return { ok, detail: ok ? "standalone manifest and PNG icons declared" : "manifest is incomplete" };
  } catch {
    return { ok: false, detail: "manifest did not return JSON" };
  }
});

for (const path of ["/sw.js", "/offline.html", "/icon-pwa-192.png", "/icon-pwa-512.png", "/apple-touch-icon.png"]) {
  await check(path, (_response, body) => ({ ok: path !== "/sw.js" || body.includes("offline.html"), detail: path === "/sw.js" ? "service worker includes offline fallback" : "public asset reachable" }));
}

const passed = checks.every((checkResult) => checkResult.ok);
console.log(JSON.stringify({ url: baseUrl.origin, passed, checks }, null, 2));
if (!passed) process.exitCode = 1;
