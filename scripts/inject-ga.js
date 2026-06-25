#!/usr/bin/env node
/**
 * Inject GA4 gtag into built HonKit HTML pages.
 * Set GA_MEASUREMENT_ID (e.g. G-XXXXXXXXXX) in GitHub repo secrets for production.
 */
const fs = require("fs");
const path = require("path");

const id = process.env.GA_MEASUREMENT_ID?.trim();
const bookDir = path.join(__dirname, "..", "_book");

if (!id) {
  console.log("inject-ga: GA_MEASUREMENT_ID not set — skipping analytics");
  process.exit(0);
}

if (!/^G-[A-Z0-9]+$/i.test(id)) {
  console.warn(`inject-ga: "${id}" does not look like a GA4 measurement ID (G-...)`);
}

const snippet = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${id}', { anonymize_ip: true });
</script>`;

function inject(file) {
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("googletagmanager.com/gtag")) {
    return false;
  }
  if (!html.includes("</head>")) {
    return false;
  }
  fs.writeFileSync(file, html.replace("</head>", `${snippet}\n</head>`));
  return true;
}

function walk(dir) {
  let count = 0;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      count += walk(full);
    } else if (name.endsWith(".html")) {
      if (inject(full)) {
        count += 1;
      }
    }
  }
  return count;
}

if (!fs.existsSync(bookDir)) {
  console.error("inject-ga: _book/ not found — run honkit build first");
  process.exit(1);
}

const updated = walk(bookDir);
console.log(`inject-ga: added GA4 (${id}) to ${updated} HTML files`);
