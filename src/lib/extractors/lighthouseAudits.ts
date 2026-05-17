import * as cheerio from 'cheerio';

export interface AuditResult {
  id: string;
  title: string;
  description: string;
  score: number; // 0 to 1
  displayValue?: string;
  category: 'performance' | 'seo' | 'best-practices' | 'accessibility';
  details?: string;
  recommendedFix?: string; // Actionable advice to improve
}

export function runLighthouseAudits(html: string, pageLoadTimeMs: number): AuditResult[] {
  const $ = cheerio.load(html);
  const audits: AuditResult[] = [];

  // ==================== PERFORMANCE ====================
  // Audit 1: Time to First Byte & Load Time
  const speedScore = pageLoadTimeMs < 1500 ? 1 : pageLoadTimeMs < 3000 ? 0.6 : 0.2;
  audits.push({
    id: 'load-speed',
    title: 'Page load time speed',
    description: 'Slower pages negatively impact search index rank and conversion rates.',
    score: speedScore,
    displayValue: `${(pageLoadTimeMs / 1000).toFixed(2)}s`,
    category: 'performance',
    recommendedFix: speedScore === 1 
      ? 'Page response is optimal!' 
      : 'Optimize server response times by setting dynamic caching headers, code-splitting client bundles, and loading heavy images lazily using next/image.'
  });

  // Audit 2: DOM element count count
  const elementCount = $('*').length;
  const domScore = elementCount < 800 ? 1 : elementCount < 1500 ? 0.75 : 0.3;
  audits.push({
    id: 'dom-size',
    title: 'Avoid an excessive DOM size',
    description: 'A large DOM will increase memory usage, cause longer style calculations, and produce costly layout reflows.',
    score: domScore,
    displayValue: `${elementCount} elements`,
    category: 'performance',
    recommendedFix: domScore === 1 
      ? 'DOM nodes are perfectly balanced.' 
      : 'Simplify your element hierarchy. Remove unnecessary wrapping <div> containers and utilize conditional client-side loading or virtualization for long lists.'
  });

  // ==================== SEO ====================
  // Audit 3: Title Length check
  const titleText = $('title').text().trim();
  let titleScore = 0;
  let titleDisplay = 'No Title Found';
  let titleFix = 'Add a <title> tag inside the server metadata configuration using export const metadata = { title: "Your Title" } in your NextJS layout or page component.';
  
  if (titleText.length > 0) {
    if (titleText.length >= 40 && titleText.length <= 60) {
      titleScore = 1;
      titleFix = 'Optimal title length configured.';
    } else {
      titleScore = 0.5;
      titleFix = `Your title length is ${titleText.length} characters. Adjust it to be between 40 and 60 characters to ensure it displays correctly in Google's search snippets.`;
    }
    titleDisplay = `${titleText.length} characters`;
  }
  
  audits.push({
    id: 'seo-title',
    title: 'Optimal title tag length',
    description: 'Title tags should ideally contain between 40 and 60 characters to fit search results perfectly.',
    score: titleScore,
    displayValue: titleDisplay,
    category: 'seo',
    recommendedFix: titleFix,
  });

  // Audit 4: Description Length check
  const descText = $('meta[name="description"]').attr('content')?.trim() || '';
  let descScore = 0;
  let descDisplay = 'No Description Found';
  let descFix = 'Add a <meta name="description"> tag inside the Next.js page metadata object. Descriptions are essential for attracting click-throughs from search engines.';
  
  if (descText.length > 0) {
    if (descText.length >= 110 && descText.length <= 160) {
      descScore = 1;
      descFix = 'Optimal meta description length configured.';
    } else {
      descScore = 0.6;
      descFix = `Your description length is ${descText.length} characters. Adjust it to be between 110 and 160 characters to provide a clean and concise snippet to search engines.`;
    }
    descDisplay = `${descText.length} characters`;
  }
  
  audits.push({
    id: 'seo-description',
    title: 'Optimal meta description length',
    description: 'Meta descriptions should be between 110 and 160 characters long.',
    score: descScore,
    displayValue: descDisplay,
    category: 'seo',
    recommendedFix: descFix,
  });

  // Audit 5: H1 presence and duplicates
  const h1Count = $('h1').length;
  let h1Fix = '';
  if (h1Count === 1) {
    h1Fix = 'Excellent page structure!';
  } else if (h1Count === 0) {
    h1Fix = 'Add exactly one <h1> tag to state the primary topic of the page clearly for structural indexing.';
  } else {
    h1Fix = `Found ${h1Count} <h1> tags. Reduce them to exactly one main <h1> tag. Replace subheadings with <h2>, <h3> or <h4>.`;
  }
  
  audits.push({
    id: 'seo-h1',
    title: 'Single H1 Heading Tag presence',
    description: 'Every web page should have a single H1 element representing the primary topic.',
    score: h1Count === 1 ? 1 : h1Count === 0 ? 0.3 : 0.5,
    displayValue: `${h1Count} tags`,
    category: 'seo',
    recommendedFix: h1Fix,
  });

  // ==================== ACCESSIBILITY ====================
  // Audit 6: Viewport meta tag
  const viewport = $('meta[name="viewport"]').length > 0;
  audits.push({
    id: 'viewport-meta',
    title: 'Has a viewport meta tag with width or initial-scale',
    description: 'A viewport configuration optimizes mobile usability.',
    score: viewport ? 1 : 0,
    displayValue: viewport ? 'Configured' : 'Missing',
    category: 'accessibility',
    recommendedFix: viewport 
      ? 'Mobile layout scaling is optimal.' 
      : 'Add a viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1"> inside your NextJS page head to ensure responsive rendering.'
  });

  // Audit 7: Image alt tags attributes
  const totalImages = $('img').length;
  let imagesWithAlt = 0;
  $('img').each((i, el) => {
    if ($(el).attr('alt') !== undefined) imagesWithAlt++;
  });
  const altScore = totalImages === 0 ? 1 : parseFloat((imagesWithAlt / totalImages).toFixed(2));
  
  audits.push({
    id: 'img-alts',
    title: 'Image elements have [alt] attributes',
    description: 'Informative alternative text improves search indexing and screen-reader accessibility.',
    score: altScore,
    displayValue: `${imagesWithAlt}/${totalImages} items`,
    category: 'accessibility',
    recommendedFix: altScore === 1 
      ? 'All images have appropriate alternative text.' 
      : 'Provide descriptive alt="..." text attributes to all outstanding images (especially using the next/image <Image alt="Description" .../> wrapper) to enable crawler accessibility.'
  });

  // ==================== BEST PRACTICES ====================
  // Audit 8: Lang attribute present on html element
  const langAttr = $('html').attr('lang');
  audits.push({
    id: 'html-lang',
    title: 'Page has lang attribute defined',
    description: 'Defining a language attribute helps browsers and assistive technologies translate or read the document.',
    score: langAttr ? 1 : 0,
    displayValue: langAttr || 'Missing',
    category: 'best-practices',
    recommendedFix: langAttr 
      ? 'HTML document language is correctly defined.' 
      : 'Set a valid lang attribute in your root html tag (e.g. <html lang="en">) in your root layout.tsx file.'
  });

  // Audit 9: Charset meta tag
  const charset = $('meta[charset]').length > 0 || $('meta[http-equiv="content-type"]').length > 0;
  audits.push({
    id: 'charset-meta',
    title: 'Has character encoding definition',
    description: 'Specifying character set encoding prevents rendering issues with special characters.',
    score: charset ? 1 : 0,
    displayValue: charset ? 'Configured' : 'Missing',
    category: 'best-practices',
    recommendedFix: charset 
      ? 'Character encoding is declared.' 
      : 'Add <meta charset="utf-8"> inside the head component to prevent rendering artifacts on special symbols.'
  });

  // Audit 10: Client-side selector engine overhead (NWSAPI / JSDOM / Sizzle check)
  let hasHeavySelectorEngine = false;
  let detectedEngine = '';
  $('script').each((i, el) => {
    const src = $(el).attr('src') || '';
    const content = $(el).html() || '';
    if (src.includes('nwsapi') || content.includes('nwsapi') || content.includes('NW.Dom')) {
      hasHeavySelectorEngine = true;
      detectedEngine = 'NWSAPI';
    } else if (src.includes('jsdom') || content.includes('jsdom')) {
      hasHeavySelectorEngine = true;
      detectedEngine = 'JSDOM';
    } else if (src.includes('sizzle') || content.includes('sizzle') || src.includes('sizzle')) {
      hasHeavySelectorEngine = true;
      detectedEngine = 'Sizzle';
    }
  });

  audits.push({
    id: 'selector-engine',
    title: 'Avoid client-side DOM selector libraries',
    description: 'Modern browsers support highly optimized native CSS selectors (querySelectorAll). Do not bundle heavy selector libraries client-side.',
    score: hasHeavySelectorEngine ? 0.4 : 1,
    displayValue: hasHeavySelectorEngine ? `${detectedEngine} detected` : 'Native QSA used',
    category: 'best-practices',
    recommendedFix: hasHeavySelectorEngine
      ? `Detected ${detectedEngine} in your client bundle scripts. Browsers support native DOM selection via document.querySelectorAll. Remove this library dependency from client bundles to reduce load overhead and boost hydration speeds.`
      : 'No heavy software-based selector engines (like NWSAPI, Sizzle, JSDOM) detected in the client bundle. Native APIs are perfectly utilized!'
  });

  return audits;
}

export function calculateLighthouseScores(audits: AuditResult[]): {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
} {
  const getAverage = (cat: string) => {
    const items = audits.filter(a => a.category === cat);
    if (items.length === 0) return 100;
    const sum = items.reduce((acc, current) => acc + current.score, 0);
    return Math.round((sum / items.length) * 100);
  };

  return {
    performance: getAverage('performance'),
    accessibility: getAverage('accessibility'),
    bestPractices: getAverage('best-practices'),
    seo: getAverage('seo'),
  };
}
