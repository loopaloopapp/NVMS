# NVMS - Next.js Metadata Visibility Scanner

NVMS (Next.js Metadata Visibility Scanner) is a complete, professional, technical SEO auditing application. It is specifically designed to crawl and detect pages inside Next.js sites where critical SEO metadata (such as `<title>`, `description`, `canonical`, `robots`, `Open Graph`, and `Twitter Cards`) are missing in the initial server-rendered HTML and are instead injected later on the client-side via JavaScript. This issue represents a significant risk for technical SEO since search engines crawlers (like Googlebot) may fail to accurately index client-rendered tags.

---

## Technical Architecture & Core Modules

The project is structured cleanly following modular design principles under the `src/` directory:

1. **Crawler & Queue Queue Management (`src/lib/crawler/`)**:
   - `discovery.ts`: Scrapes the initial DOM of the page using Cheerio, extracts relative and absolute internal anchor tags, normalizes them, filters query strings and predefined paths (e.g. `/api`, `/_next`), and feeds them to the BFS crawler loop on the frontend.
   
2. **Dual phase Analysis Engine (`src/lib/analyzer/`)**:
   - `fetchInitialHtml.ts`: Simple raw HTTP network client to fetch the indexable raw server HTML response mimicking `Googlebot/2.1` User Agent.
   - `renderWithBrowser.ts`: Launches a headless Chromium browser instance powered by **Playwright** to execute JS logic on the page, wait for `networkidle`, and capture the post-hydration rendered DOM snapshot.

3. **Metadata Extraction Module (`src/lib/extractors/`)**:
   - `headMetadata.ts`: Robust DOM scraper that parses and collects title, meta-description, canonical hrefs, robot options, hreflang listings, Open Graph tags (`og:*`), Twitter tags, and validates JSON-LD schemas.
   - `contentSignals.ts`: Detects client-side rendering dependency by comparing text ratios (length of body text) between the initial HTML response and the hydrated client browser window.

4. **Comparison Module (`src/lib/compare/`)**:
   - `metadataDiff.ts`: Head-to-head field comparator that identifies missing tags, dynamically mutated tags, or dropped declarations.

5. **Risk Scoring Engine (`src/lib/scoring/`)**:
   - `seoRiskScore.ts`: Calculates an index score from 0 (Perfect) to 10+ (Critical) based on severity weights:
     - `title`, `description`, `canonical`, `robots` mismatch = **Critical**
     - `Open Graph`, `Twitter` mismatch = **High Risk**
     - Heavy reliance on CSR body content = **Critical**

---

## Setup & Running Locally

Follow these quick commands to spin up the local server on your system:

### 1. Install System and Project Dependencies
Make sure you have NodeJS >= 20 installed. In your terminal run:
```bash
npm install
```

### 2. Install Playwright Headless Browsers
Next.js API routes will execute local chromium instances. Install Playwright's headless binaries:
```bash
npx playwright install chromium
```

### 3. Run Development Server
```bash
npm run dev
```

Open `http://localhost:3000` inside your browser to start auditing pages!

---

## Sample JSON Output Payload
An example payload returned by the `/api/analyze` route when inspecting an optimized dynamic layout:

```json
{
  "url": "https://example-nextjs-app.com/products",
  "finalUrl": "https://example-nextjs-app.com/products",
  "status": 200,
  "renderedStatus": 200,
  "severity": "critical",
  "score": 8,
  "isCSRDependent": true,
  "initialMetadata": {
    "title": { "value": null, "present": false },
    "description": { "value": null, "present": false },
    "canonical": { "value": null, "present": false },
    "robots": { "value": null, "present": false },
    "hreflang": { "value": [], "present": false },
    "og": {
      "title": { "value": null, "present": false },
      "description": { "value": null, "present": false }
    }
  },
  "renderedMetadata": {
    "title": { "value": "Our Products - Discover Sleek Tools", "present": true },
    "description": { "value": "Browse our awesome catalog of SEO optimization products.", "present": true },
    "canonical": { "value": "https://example-nextjs-app.com/products", "present": true },
    "robots": { "value": "index, follow", "present": true }
  },
  "diffs": [
    { "field": "title", "initialValue": null, "renderedValue": "Our Products - Discover Sleek Tools", "status": "missing_initially" },
    { "field": "description", "initialValue": null, "renderedValue": "Browse our awesome catalog of SEO optimization products.", "status": "missing_initially" }
  ],
  "issues": [
    {
      "severity": "critical",
      "message": "title is missing in initial HTML but present after JS.",
      "probableCause": "Metadata is likely being injected client-side (e.g., in a useEffect or Client Component).",
      "recommendedFix": "Use export const metadata or generateMetadata in Server Components."
    }
  ]
}
```
