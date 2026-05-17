export const mockScanResults = [
  {
    url: "https://example-nextjs-app.com/",
    finalUrl: "https://example-nextjs-app.com/",
    status: 200,
    renderedStatus: 200,
    severity: "OK" as const,
    score: 0,
    isCSRDependent: false,
    initialMetadata: {
      title: { value: "Premium SEO Tool for Next.js - NVMS", present: true },
      description: { value: "Audit and verify your Next.js SEO metadata rendering issues automatically.", present: true },
      canonical: { value: "https://example-nextjs-app.com/", present: true },
      robots: { value: "index, follow", present: true },
      hreflang: { value: [], present: false },
      og: {
        title: { value: "Premium SEO Tool for Next.js - NVMS", present: true },
        description: { value: "Audit and verify your Next.js SEO metadata rendering issues automatically.", present: true },
        image: { value: "https://example-nextjs-app.com/og-image.jpg", present: true },
        url: { value: "https://example-nextjs-app.com/", present: true }
      },
      twitter: {
        title: { value: "Premium SEO Tool for Next.js - NVMS", present: true },
        description: { value: "Audit and verify your Next.js SEO metadata rendering issues automatically.", present: true },
        image: { value: "https://example-nextjs-app.com/og-image.jpg", present: true },
        card: { value: "summary_large_image", present: true }
      },
      jsonLd: { present: true, contents: ["{}"] }
    },
    renderedMetadata: {
      title: { value: "Premium SEO Tool for Next.js - NVMS", present: true },
      description: { value: "Audit and verify your Next.js SEO metadata rendering issues automatically.", present: true },
      canonical: { value: "https://example-nextjs-app.com/", present: true },
      robots: { value: "index, follow", present: true },
      hreflang: { value: [], present: false },
      og: {
        title: { value: "Premium SEO Tool for Next.js - NVMS", present: true },
        description: { value: "Audit and verify your Next.js SEO metadata rendering issues automatically.", present: true },
        image: { value: "https://example-nextjs-app.com/og-image.jpg", present: true },
        url: { value: "https://example-nextjs-app.com/", present: true }
      },
      twitter: {
        title: { value: "Premium SEO Tool for Next.js - NVMS", present: true },
        description: { value: "Audit and verify your Next.js SEO metadata rendering issues automatically.", present: true },
        image: { value: "https://example-nextjs-app.com/og-image.jpg", present: true },
        card: { value: "summary_large_image", present: true }
      },
      jsonLd: { present: true, contents: ["{}"] }
    },
    diffs: [],
    issues: [],
    discoveredLinks: [
      "https://example-nextjs-app.com/about",
      "https://example-nextjs-app.com/products",
      "https://example-nextjs-app.com/blog/seo-tips",
      "https://example-nextjs-app.com/dashboard"
    ],
    performanceMetrics: {
      ttfb: 120,
      domContentLoaded: 650,
      loadTime: 950,
      fcp: 520,
      cls: 0.01
    },
    lighthouse: {
      scores: {
        performance: 98,
        accessibility: 100,
        bestPractices: 95,
        seo: 100
      },
      audits: [
        { id: "load-speed", title: "Page load time speed", description: "Slower pages negatively impact search index rank and conversion rates.", score: 1, displayValue: "0.95s", category: "performance" },
        { id: "dom-size", title: "Avoid an excessive DOM size", description: "A large DOM will increase memory usage, cause longer style calculations, and produce costly layout reflows.", score: 1, displayValue: "340 elements", category: "performance" },
        { id: "seo-title", title: "Optimal title tag length", description: "Title tags should ideally contain between 40 and 60 characters to fit search results perfectly.", score: 1, displayValue: "44 characters", category: "seo" },
        { id: "seo-description", title: "Optimal meta description length", description: "Meta descriptions should be between 110 and 160 characters long.", score: 1, displayValue: "135 characters", category: "seo" },
        { id: "seo-h1", title: "Single H1 Heading Tag presence", description: "Every web page should have a single H1 element representing the primary topic.", score: 1, displayValue: "1 tags", category: "seo" },
        { id: "viewport-meta", title: "Has a viewport meta tag with width or initial-scale", description: "A viewport configuration optimizes mobile usability.", score: 1, displayValue: "Configured", category: "accessibility" },
        { id: "img-alts", title: "Image elements have [alt] attributes", description: "Informative alternative text improves search indexing and screen-reader accessibility.", score: 1, displayValue: "4/4 items", category: "accessibility" },
        { id: "html-lang", title: "Page has lang attribute defined", description: "Defining a language attribute helps browsers and assistive technologies translate or read the document.", score: 1, displayValue: "en", category: "best-practices" },
        { id: "charset-meta", title: "Has character encoding definition", description: "Specifying character set encoding prevents rendering issues with special characters.", score: 1, displayValue: "Configured", category: "best-practices" }
      ]
    }
  },
  {
    url: "https://example-nextjs-app.com/about",
    finalUrl: "https://example-nextjs-app.com/about",
    status: 200,
    renderedStatus: 200,
    severity: "warning" as const,
    score: 2,
    isCSRDependent: false,
    initialMetadata: {
      title: { value: "About Us | NVMS Scanner", present: true },
      description: { value: "Learn more about our team and mission.", present: true },
      canonical: { value: "https://example-nextjs-app.com/about", present: true },
      robots: { value: "index, follow", present: true },
      hreflang: { value: [], present: false },
      og: {
        title: { value: null, present: false },
        description: { value: null, present: false },
        image: { value: null, present: false },
        url: { value: null, present: false }
      },
      twitter: {
        title: { value: null, present: false },
        description: { value: null, present: false },
        image: { value: null, present: false },
        card: { value: null, present: false }
      },
      jsonLd: { present: false, contents: [] }
    },
    renderedMetadata: {
      title: { value: "About Us | NVMS Scanner", present: true },
      description: { value: "Learn more about our team and mission.", present: true },
      canonical: { value: "https://example-nextjs-app.com/about", present: true },
      robots: { value: "index, follow", present: true },
      hreflang: { value: [], present: false },
      og: {
        title: { value: "About Us | NVMS Scanner", present: true },
        description: { value: "Learn more about our team and mission.", present: true },
        image: { value: "https://example-nextjs-app.com/og-about.jpg", present: true },
        url: { value: "https://example-nextjs-app.com/about", present: true }
      },
      twitter: {
        title: { value: "About Us | NVMS Scanner", present: true },
        description: { value: "Learn more about our team and mission.", present: true },
        image: { value: "https://example-nextjs-app.com/og-about.jpg", present: true },
        card: { value: "summary", present: true }
      },
      jsonLd: { present: false, contents: [] }
    },
    diffs: [
      { field: "og:title", initialValue: null, renderedValue: "About Us | NVMS Scanner", status: "missing_initially" },
      { field: "og:description", initialValue: null, renderedValue: "Learn more about our team and mission.", status: "missing_initially" },
      { field: "og:image", initialValue: null, renderedValue: "https://example-nextjs-app.com/og-about.jpg", status: "missing_initially" },
      { field: "twitter:title", initialValue: null, renderedValue: "About Us | NVMS Scanner", status: "missing_initially" }
    ],
    issues: [
      {
        severity: "high risk",
        message: "og:title appears only after JS execution.",
        probableCause: "Social tags are rendered client-side, making them invisible to social media scrapers.",
        recommendedFix: "Move Open Graph and Twitter metadata to Server Components."
      }
    ],
    discoveredLinks: [],
    performanceMetrics: {
      ttfb: 180,
      domContentLoaded: 980,
      loadTime: 1450,
      fcp: 820,
      cls: 0.02
    },
    lighthouse: {
      scores: {
        performance: 92,
        accessibility: 88,
        bestPractices: 95,
        seo: 85
      },
      audits: [
        { id: "load-speed", title: "Page load time speed", description: "Slower pages negatively impact search index rank and conversion rates.", score: 0.92, displayValue: "1.45s", category: "performance" },
        { id: "dom-size", title: "Avoid an excessive DOM size", description: "A large DOM will increase memory usage, cause longer style calculations, and produce costly layout reflows.", score: 1, displayValue: "420 elements", category: "performance" },
        { id: "seo-title", title: "Optimal title tag length", description: "Title tags should ideally contain between 40 and 60 characters to fit search results perfectly.", score: 0.5, displayValue: "23 characters", category: "seo" },
        { id: "seo-description", title: "Optimal meta description length", description: "Meta descriptions should be between 110 and 160 characters long.", score: 0.6, displayValue: "38 characters", category: "seo" },
        { id: "seo-h1", title: "Single H1 Heading Tag presence", description: "Every web page should have a single H1 element representing the primary topic.", score: 1, displayValue: "1 tags", category: "seo" },
        { id: "viewport-meta", title: "Has a viewport meta tag with width or initial-scale", description: "A viewport configuration optimizes mobile usability.", score: 1, displayValue: "Configured", category: "accessibility" },
        { id: "img-alts", title: "Image elements have [alt] attributes", description: "Informative alternative text improves search indexing and screen-reader accessibility.", score: 0.5, displayValue: "1/2 items", category: "accessibility" },
        { id: "html-lang", title: "Page has lang attribute defined", description: "Defining a language attribute helps browsers and assistive technologies translate or read the document.", score: 1, displayValue: "en", category: "best-practices" },
        { id: "charset-meta", title: "Has character encoding definition", description: "Specifying character set encoding prevents rendering issues with special characters.", score: 1, displayValue: "Configured", category: "best-practices" }
      ]
    }
  },
  {
    url: "https://example-nextjs-app.com/products",
    finalUrl: "https://example-nextjs-app.com/products",
    status: 200,
    renderedStatus: 200,
    severity: "critical" as const,
    score: 8,
    isCSRDependent: true,
    initialMetadata: {
      title: { value: null, present: false },
      description: { value: null, present: false },
      canonical: { value: null, present: false },
      robots: { value: null, present: false },
      hreflang: { value: [], present: false },
      og: {
        title: { value: null, present: false },
        description: { value: null, present: false },
        image: { value: null, present: false },
        url: { value: null, present: false }
      },
      twitter: {
        title: { value: null, present: false },
        description: { value: null, present: false },
        image: { value: null, present: false },
        card: { value: null, present: false }
      },
      jsonLd: { present: false, contents: [] }
    },
    renderedMetadata: {
      title: { value: "Our Products - Discover Sleek Tools", present: true },
      description: { value: "Browse our awesome catalog of SEO optimization products.", present: true },
      canonical: { value: "https://example-nextjs-app.com/products", present: true },
      robots: { value: "index, follow", present: true },
      hreflang: { value: [], present: false },
      og: {
        title: { value: "Our Products - Discover Sleek Tools", present: true },
        description: { value: "Browse our awesome catalog of SEO optimization products.", present: true },
        image: { value: "https://example-nextjs-app.com/og-products.jpg", present: true },
        url: { value: "https://example-nextjs-app.com/products", present: true }
      },
      twitter: {
        title: { value: "Our Products - Discover Sleek Tools", present: true },
        description: { value: "Browse our awesome catalog of SEO optimization products.", present: true },
        image: { value: "https://example-nextjs-app.com/og-products.jpg", present: true },
        card: { value: "summary_large_image", present: true }
      },
      jsonLd: { present: true, contents: ["{}"] }
    },
    diffs: [
      { field: "title", initialValue: null, renderedValue: "Our Products - Discover Sleek Tools", status: "missing_initially" },
      { field: "description", initialValue: null, renderedValue: "Browse our awesome catalog of SEO optimization products.", status: "missing_initially" },
      { field: "canonical", initialValue: null, renderedValue: "https://example-nextjs-app.com/products", status: "missing_initially" },
      { field: "robots", initialValue: null, renderedValue: "index, follow", status: "missing_initially" }
    ],
    issues: [
      {
        severity: "critical",
        message: "title is missing in initial HTML but present after JS.",
        probableCause: "Metadata is likely being injected client-side (e.g., in a useEffect or Client Component).",
        recommendedFix: "Use export const metadata or generateMetadata in Server Components."
      },
      {
        severity: "critical",
        message: "description is missing in initial HTML but present after JS.",
        probableCause: "Metadata is injected client-side.",
        recommendedFix: "Define description statically in your layout.tsx or page.tsx metadata export."
      },
      {
        severity: "critical",
        message: "Content relies heavily on Client-Side Rendering.",
        probableCause: "Main content is not present in initial HTML, likely relying on client-side data fetching.",
        recommendedFix: "Use SSR (Server-Side Rendering) or SSG (Static Site Generation) for critical content pages."
      }
    ],
    discoveredLinks: [],
    performanceMetrics: {
      ttfb: 540,
      domContentLoaded: 2800,
      loadTime: 3800,
      fcp: 2400,
      cls: 0.12
    },
    lighthouse: {
      scores: {
        performance: 42,
        accessibility: 70,
        bestPractices: 60,
        seo: 40
      },
      audits: [
        { id: "load-speed", title: "Page load time speed", description: "Slower pages negatively impact search index rank and conversion rates.", score: 0.25, displayValue: "3.80s", category: "performance" },
        { id: "dom-size", title: "Avoid an excessive DOM size", description: "A large DOM will increase memory usage, cause longer style calculations, and produce costly layout reflows.", score: 0.5, displayValue: "1850 elements", category: "performance" },
        { id: "seo-title", title: "Optimal title tag length", description: "Title tags should ideally contain between 40 and 60 characters to fit search results perfectly.", score: 1, displayValue: "34 characters", category: "seo" },
        { id: "seo-description", title: "Optimal meta description length", description: "Meta descriptions should be between 110 and 160 characters long.", score: 0.6, displayValue: "52 characters", category: "seo" },
        { id: "seo-h1", title: "Single H1 Heading Tag presence", description: "Every web page should have a single H1 element representing the primary topic.", score: 0.3, displayValue: "0 tags", category: "seo" },
        { id: "viewport-meta", title: "Has a viewport meta tag with width or initial-scale", description: "A viewport configuration optimizes mobile usability.", score: 1, displayValue: "Configured", category: "accessibility" },
        { id: "img-alts", title: "Image elements have [alt] attributes", description: "Informative alternative text improves search indexing and screen-reader accessibility.", score: 0.4, displayValue: "2/5 items", category: "accessibility" },
        { id: "html-lang", title: "Page has lang attribute defined", description: "Defining a language attribute helps browsers and assistive technologies translate or read the document.", score: 0, displayValue: "Missing", category: "best-practices" },
        { id: "charset-meta", title: "Has character encoding definition", description: "Specifying character set encoding prevents rendering issues with special characters.", score: 1, displayValue: "Configured", category: "best-practices" }
      ]
    }
  }
];
