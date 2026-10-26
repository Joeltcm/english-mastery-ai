const appUrl = process.env.RETENTION_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
const secret = process.env.CRON_SECRET;

if (!appUrl || !secret) {
  console.error("RETENTION_APP_URL (or NEXT_PUBLIC_APP_URL) and CRON_SECRET are required.");
  process.exit(1);
}

const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/maintenance/retention`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
});
const body = await response.text();
console.log(body);
if (!response.ok) process.exit(1);
