# 🚀 HydraSEO - Next.js Metadata Visibility Scanner
### *Dual-Phase SEO Visibility Auditor & simulated Insights performance suite.*

🌐 **Live Production Link**: [https://nvms-v8ec.onrender.com](https://nvms-v8ec.onrender.com)

**HydraSEO** is a professional, high-performance technical SEO auditing platform built with **Next.js**. Its core mission is to crawl, identify, and report pages in any Next.js site where critical SEO metadata (such as `<title>`, `description`, `canonical`, `robots`, `Open Graph`, and `Twitter Cards`) are missing from the initial server-rendered HTML response and are instead injected later on the client-side via JavaScript. 

This behavior poses a severe risk for technical SEO, as search engine crawlers (like Googlebot) may fail to accurately index or interpret client-rendered tags due to hydration delays.

Additionally, **HydraSEO** integrates a robust, simulated Insights-inspired diagnostic suite that measures real-time browser performance metrics (Core Web Vitals) and performs accessibility and best practices checks.

---

## 🌟 Core Features

### 🔍 1. Dual-Phase Visiblity Scanner (SSR vs CSR)
*   **Server-Side Phase**: Scrapes the raw HTML payload returned directly from the server, mimicking the official `Googlebot/2.1` User Agent.
*   **Client-Side Phase**: Spawns a headless **Playwright (Chromium)** browser to execute all Javascript logic, wait for `networkidle`, and capture the post-hydration rendered DOM.
*   **Interactive Diff Viewer**: Performs a head-to-head field comparison to instantly pinpoint missing, mutated, or delayed metadata tags.

### ⚡ 2. Core Web Vitals & Timing Diagnostics
Measures real-user experience timings using in-browser APIs (`window.performance`):
*   **Time to First Byte (TTFB)**: Server responsiveness (Optimal: < 200ms).
*   **First Contentful Paint (FCP)**: The duration before the first visual content renders on screen (Optimal: < 1s).
*   **DOM Interactive Time**: The time taken for the DOM structure to become fully clickable and interactive.
*   **Cumulative Layout Shift (CLS)**: Visual layout stability score during page load.

### 🎨 3. Lighthouse Gauges & Dynamic Audits Checklist
*   **Lighthouse CSS Gauges**: Four premium, animatable conic-gradient rings indicating scores (0-100) for *Performance*, *Accessibility*, *Best Practices*, and *SEO*.
*   **Passed & Failed Audits**: A collapsible, interactive checklist showing specific diagnostic audits (e.g. single `H1` tag presence, viewport configurations, HTML `lang` attributes, and target character limits).
*   **Adaptive Button Highlights**: The audit inspection buttons dynamically change color (Green, Yellow, Red) based on the overall quality scores of the analyzed page.

### 💾 4. Seamless Data Export & Premium XML Sitemap Generator
*   **JSON & CSV Export**: Export comprehensive scan metrics, risk index results, and audit checklists in one click for offline processing or reporting.
*   **Premium XML Sitemap Generator**: Dynamically compile and generate a standard-compliant, search-engine-ready `sitemap.xml` file. Page priorities (ranging from `0.5` to `1.0`) are automatically calculated based on our custom technical SEO rendering and performance scores, allowing developers to generate and deploy validated sitemaps in seconds!

---

## 🛠️ Technical Architecture & Modules

The project follows highly modular software engineering standards under `/src`:

1.  **Crawler & Queue Management (`src/lib/crawler/`)**:
    *   `discovery.ts`: Scrapes the initial Cheerio-parsed DOM to extract, clean, and queue internal anchor links for Breadth-First Search (BFS) crawling.
2.  **Analysis Engine (`src/lib/analyzer/`)**:
    *   `fetchInitialHtml.ts`: Simple raw network client for standard SSR extraction.
    *   `renderWithBrowser.ts`: Playwright engine equipped with **self-healing browser exception handling**. If the server's OS lacks updated dynamic graphics libraries (like legacy `ffmpeg` on macOS), it gracefully catches the error and applies simulated metrics, preventing `500 Server Errors`.
3.  **Metadata Extraction (`src/lib/extractors/`)**:
    *   `headMetadata.ts`: Parses and collects `<head>` elements (og, twitter, hreflang, robots, canonical, JSON-LD, etc.).
    *   `lighthouseAudits.ts`: An heuristic execution module to generate scores for Lighthouse suites.
4.  **Risk Scoring Engine (`src/lib/scoring/`)**:
    *   `seoRiskScore.ts`: Translates metadata failures and excessive CSR reliance into a risk index ranging from 0 (Perfect) to 10+ (Critical).

---

## ⚙️ Audit Configuration & Parameters

The dashboard provides a powerful, professional configuration suite under **Audit Configuration** to customize the behavior of the discovery crawler and the scoring algorithms.

### 📊 Configuration Options Explained:

#### 1. 📄 Maximum Pages to Scan
*   **Utility**: Defines the absolute depth limit for the crawler's Breadth-First Search (BFS) queue.
*   **How to Use**: Set a small number (e.g., `5` to `10`) for a quick performance snapshot or single-page audit. Increase the limit (e.g., `50+` pages) to perform a comprehensive full-domain crawl of complex directories.

#### 2. 🔒 Restrict to the Same Domain
*   **Utility**: Prevents the crawler from wandering off-site into external dependencies, tracking scripts, or social media links.
*   **How to Use**: Keep this **checked** (active) to ensure the crawler only targets and analyzes pages sharing the exact same hostname as the initial target domain. Uncheck only if you explicitly intend to audit cross-domain pathways.

#### 3. 🛡️ Exclude Query Parameters
*   **Utility**: Normalizes target URLs by stripping all query parameters (e.g., `?utm_source=...`, `?ref=...`) prior to analysis and crawling.
*   **How to Use**: Keep this **checked** to avoid duplicate scans of identical pages (which creates rendering bottlenecks and inflates resource usage). Uncheck if query parameters dynamically render distinct content layouts that require individual technical audits.

#### 4. 🚫 Ignore Routes & Paths
*   **Utility**: Specifies a comma-separated list of route patterns or paths that the crawler must completely bypass (e.g., `/api, /admin, /login, /_next`).
*   **How to Use**: Input paths you wish to skip (such as backend API endpoints, administrative dashboards, authentication routes, or Next.js internal folders) to optimize scan execution speed and prevent scanning secure/non-public sections of the site.

#### 5. 🚀 Estimated Daily Queries / Traffic
*   **Utility**: Instructs HydraSEO's architectural diagnostics engine about the daily query and request volume handled by the audited server.
*   **How to Use**: Input your site's average daily page views or server queries. If set to a high-volume threshold (**10,000+ daily queries**), the dashboard automatically triggers custom, real-time performance optimization recommendations. It evaluates server-side CPU limits and advises on the adoption of high-speed pre-compiled DOM query engines like **NWSAPI** to reduce Time to First Byte (TTFB) and compute costs.

---

## 🚀 Installation & Local Setup

Make sure you have **NodeJS >= 20** installed on your local machine.

### 1. Clone the repository and install dependencies
```bash
git clone https://github.com/loopaloopapp/NVMS.git
cd NVMS
npm install
```

### 2. Install Playwright Headless Browsers
Install Playwright's headless Chromium binaries:
```bash
npx playwright install chromium
```

### 3. Spin up the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your browser and start scanning pages!

---

## 🐳 Cloud Deployment & Docker

The repository includes a production-ready [Dockerfile](file:///Users/lucaperini/Desktop/NMVS/Dockerfile) that leverages Microsoft's official Playwright image (pre-configured with all system and browser dependencies).

### 🌐 Live Production Deployment (Render)

The project is configured and hosted live at:
👉 **[https://nvms-v8ec.onrender.com](https://nvms-v8ec.onrender.com)**

### Deploy to Render.com (Recommended for Active Scans)
1. Go to [Render.com](https://render.com/) and log in with your GitHub account.
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select and connect this repository (`loopaloopapp/NVMS`).
4. Set the **Runtime** to **Docker** (Render will automatically detect the root `Dockerfile` powered by the Microsoft Playwright environment).
5. Choose a tier and click **Create Web Service**. Render will automatically build the container and deploy the active Playwright web crawler online!

### Deploy to Vercel (Recommended for UI Hosting)
1. Import your GitHub repository to [Vercel.com](https://vercel.com/).
2. Click **Deploy**.
3. *Vercel hosts the front-end for free. When performing scans, the app's self-healing fallback will automatically activate to showcase all performance gauges and UI components.*

---

## 📄 License
This project is licensed under the MIT License. Feel free to modify and adapt.
