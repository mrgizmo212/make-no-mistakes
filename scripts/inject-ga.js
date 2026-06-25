#!/usr/bin/env node
/**
 * Inject GA4 gtag + persistent footer (links + About) into built HonKit HTML pages.
 * Default GA ID: G-X1WD7Y4M50. Override with GA_MEASUREMENT_ID env.
 */
const fs = require("fs");
const path = require("path");

const DEFAULT_GA_ID = "G-X1WD7Y4M50";
const gaId = (process.env.GA_MEASUREMENT_ID?.trim() || DEFAULT_GA_ID);
const bookDir = path.join(__dirname, "..", "_book");

if (!/^G-[A-Z0-9]+$/i.test(gaId)) {
  console.warn(`inject: "${gaId}" does not look like a GA4 measurement ID (G-...)`);
}

const gaSnippet = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${gaId}');
</script>`;

// Compact footer shown on every page
const footerHtml = `
<footer class="custom-footer">
  <div>
    <strong>About the guy who used AI to put all this together</strong>
    <p>Adam Heimann is the co-founder and CEO of <a href="https://truetradinggroup.com/">True Trading Group</a>, where he also leads AI strategy and product.</p>
  </div>
  <div class="footer-links">
    <a href="https://truetradinggroup.com/">True Trading Group</a>
    <a href="https://www.linkedin.com/in/adam-heimann-68789610/">LinkedIn</a>
    <a href="https://x.com/adamheimann">X</a>
  </div>
</footer>`;

function inject(file) {
  let html = fs.readFileSync(file, "utf8");
  let changed = false;

  // Inject GA4 if missing
  if (!html.includes("googletagmanager.com/gtag")) {
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${gaSnippet}\n</head>`);
      changed = true;
    }
  }

  // Inject custom footer (About + links) if missing
  if (!html.includes("custom-footer")) {
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${footerHtml}\n</body>`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, html);
  }
  return changed;
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
  console.error("inject: _book/ not found — run honkit build first");
  process.exit(1);
}

const updated = walk(bookDir);
console.log(`inject: added GA4 + footer to ${updated} HTML files (GA: ${gaId})`);
