#!/usr/bin/env node
/**
 * Inject GA4 gtag into built HonKit HTML pages.
 * Default: G-X1WD7Y4M50 (make-no-mistakes). Override with GA_MEASUREMENT_ID env.
 */
const fs = require("fs");
const path = require("path");

const DEFAULT_GA_ID = "G-X1WD7Y4M50";
const id = (process.env.GA_MEASUREMENT_ID?.trim() || DEFAULT_GA_ID);
const bookDir = path.join(__dirname, "..", "_book");

if (!/^G-[A-Z0-9]+$/i.test(id)) {
  console.warn(`inject-ga: "${id}" does not look like a GA4 measurement ID (G-...)`);
}

const snippet = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${id}');
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
