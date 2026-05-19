# 🐉 HydraSEO
### *The All-in-One AI & Technical SEO Intelligence Platform*

> **Repository**: [loopaloopapp/HydraSEO](https://github.com/loopaloopapp/HydraSEO)  
> **Stack**: Next.js 16 · TypeScript · Playwright · Neon DB · Lucide Icons

---

## 🌟 What is HydraSEO?

**HydraSEO** is a professional, multi-module SEO intelligence platform that covers the full visibility spectrum — from traditional technical crawling to AI-native presence and generative search gap analysis. Three specialized tools, one unified interface.

| Module | Description |
|---|---|
| 🔧 **Technical SEO Scan** | Deep crawl your site for metadata failures, CSR hydration gaps, and Core Web Vitals |
| 🧠 **AI Presence Audit (AIO)** | Discover how ChatGPT, Gemini, Claude, and Perplexity describe and cite your brand |
| 🌐 **GEO Lens** | Compare Google organic visibility vs AI generative citation coverage, query by query |

---

## 🔧 Module 1 — Technical SEO Scan

Crawls your site using a dual-phase SSR + CSR pipeline to identify pages where critical SEO metadata is missing from the initial server-rendered HTML.

### Key Features
- **Dual-Phase Scanner**: Compares raw server HTML (via `Googlebot/2.1` UA) against post-hydration Playwright DOM captures
- **Metadata Diff Viewer**: Side-by-side `<title>`, `description`, `canonical`, `robots`, Open Graph, Twitter Cards comparison
- **Core Web Vitals**: TTFB, FCP, DOM Interactive, CLS measurements via `window.performance` APIs
- **Lighthouse-style Gauges**: Animated conic-gradient rings for Performance, Accessibility, Best Practices, SEO (0–100)
- **Risk Score Engine**: Translates metadata failures and CSR hydration delays into a 0–10+ risk index
- **Ignore Routes**: Skip `/api`, `/admin`, `/login`, `/_next` and any custom paths
- **JSON & CSV Export**: Download full scan reports for offline reporting
- **XML Sitemap Generator**: Auto-calculates page priorities from SEO scores and exports a valid `sitemap.xml`
- **Robots.txt Generator**: One-click generation of a Google-compliant `robots.txt` that grants full access to all major AI indexers (GPTBot, ClaudeBot, Gemini, Perplexity, Copilot)

---

## 🧠 Module 2 — AI Presence Audit (AIO)

Discover how AI platforms position, describe, and cite your brand in generative responses — from Share of Voice to narrative sentiment mapping.

### Key Features
- **Multi-Engine Analysis**: Queries ChatGPT (GPT-4o), Gemini 1.5 Pro, Claude 3.5 Sonnet, Perplexity AI, and Microsoft Copilot
- **Share of Voice Score**: Measures how often your brand appears vs competitors across AI-generated responses
- **Sentiment & Narrative Map**: Categorizes brand mentions as Positive, Neutral, or Negative with context snippets
- **Top Cited Prompts**: Shows which queries drive the most AI brand visibility
- **Entity Coverage Breakdown**: Tracks which brand attributes (pricing, features, reviews, integrations) are cited by AI models
- **Competitive Positioning Matrix**: Compares your brand's AI presence against up to 5 competitors
- **Brand Safety Flags**: Highlights potentially damaging narratives or factual errors in AI responses
- **PDF Export**: Full audit report printable or downloadable

---

## 🌐 Module 3 — GEO Lens (Organic vs AI Visibility)

A comparative operational dashboard that maps your Google Search Console organic performance against AI generative search citation coverage, query by query.

### Key Features
- **GSC CSV Import**: Upload your Google Search Console query export — auto-detects the query column and parses all rows
- **GEO Gap Index**: Proprietary metric combining SEO opportunity score, organic demand, and AI citation density to surface the highest-impact gaps
- **Comparative Query Matrix**: Full table of your target queries with Google position, organic clicks, AI citations found, gap score, and recommended action
- **Engine Citation Breakdown**: Coverage rate per AI engine (Perplexity, ChatGPT, Gemini, Claude, Copilot)
- **Dynamic Query Clustering**: Automatically classifies queries into Navigational, Comparison, Transactional, and Informational clusters with computed avg position and AI coverage
- **Entity Mapping**: Tracks which brand entities (homepage, pricing, FAQ, features, comparisons) are cited by generative engines — and which are critically absent
- **Opportunity Map**: Visualizes high-impact, low-coverage queries to prioritize GEO optimization efforts
- **PDF Export**: Print-optimized full dashboard export

---

## 🤖 Robots.txt Generator

Available from the header of every page. Generates a production-ready `robots.txt` that:
- Grants full crawl access to Googlebot and all standard bots
- Explicitly allows all major AI indexers for maximum generative search citation potential:
  - `GPTBot`, `ChatGPT-User`, `OAI-SearchBot` (OpenAI)
  - `ClaudeBot`, `Claude-Web` (Anthropic)
  - `Google-Extended` (Gemini training)
  - `PerplexityBot`
  - `Applebot-Extended`, `Cohere-cohere`, `FacebookBot`
- Disallows `/api/`, `/admin/`, `/login/`, `/_next/`
- Includes `Sitemap:` reference for your domain

---

## 🛠️ Technical Architecture

```
/src
  /app
    page.tsx              → Technical SEO Scan (/)
    /aio/page.tsx         → AI Presence Audit (/aio)
    /geo/page.tsx         → GEO Lens Dashboard (/geo)
    /upgrade/page.tsx     → Plan upgrade page
    /api
      /analyze            → SSR + Playwright crawler API
      /aioAnalyze         → AI brand presence engine
      /geoAnalyze         → GEO gap index calculator
      /syncUser           → Neon DB user sync
  /lib
    /crawler/discovery.ts       → BFS link queue & URL normalization
    /analyzer/fetchInitialHtml  → Raw server-side HTML extraction
    /analyzer/renderWithBrowser → Playwright headless engine (self-healing)
    /extractors/headMetadata    → <head> element parser
    /extractors/lighthouseAudits → Heuristic Lighthouse score generator
    /scoring/seoRiskScore       → Risk index calculator (0–10+)
```

---

## ⚙️ Scan Configuration Options

| Option | Description |
|---|---|
| Maximum Pages to Scan | BFS crawl depth limit (5 for quick audits, 50+ for full domain) |
| Restrict to Same Domain | Only crawl pages on the same hostname |
| Exclude Query Parameters | Deduplicate URLs by stripping `?utm_*` and similar params |
| Ignore Routes & Paths | Skip `/api`, `/admin`, `/login`, custom paths |
| Estimated Daily Traffic | Enables high-volume performance recommendations (10k+ threshold) |

---

## 🚀 Installation & Local Setup

> Requires **Node.js ≥ 20**

### 1. Clone and install

```bash
git clone https://github.com/loopaloopapp/HydraSEO.git
cd HydraSEO
npm install
```

### 2. Install Playwright browsers

```bash
npx playwright install chromium
```

### 3. Configure environment

Create a `.env.local` file:

```env
DATABASE_URL=your_neon_db_connection_string
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start scanning.

---

## 🐳 Deployment

### Deploy to Render.com *(Recommended — enables live Playwright crawls)*

1. Go to [Render.com](https://render.com/) and log in with your GitHub account
2. Click **New +** → **Web Service**
3. Connect `loopaloopapp/HydraSEO`
4. Set Runtime to **Docker** (auto-detects the root `Dockerfile`)
5. Set your `DATABASE_URL` environment variable
6. Click **Create Web Service**

### Deploy to Vercel *(Recommended for UI-only hosting)*

1. Import `loopaloopapp/HydraSEO` to [Vercel.com](https://vercel.com/)
2. Add `DATABASE_URL` in environment settings
3. Click **Deploy**

> ⚠️ On Vercel, the Playwright headless crawler falls back to a self-healing simulated mode — all UI components, gauges, and dashboards remain fully functional.

---

## 📋 User Plans

| Plan | Scans | Features |
|---|---|---|
| Free Tier | 1 scan | All 3 modules, basic reports |
| Pro (100) | 100 scans | Full reports, PDF export, priority support |
| Pro (500) | 500 scans | All Pro features |
| Pro (1000) | 1,000 scans | All Pro features |
| Ultimate | Unlimited | All features, unlimited scans |

---

## 📄 License

MIT License — free to modify, fork, and adapt.

---

*Built with ❤️ using Next.js, TypeScript, Playwright, and Neon DB.*
