import * as cheerio from 'cheerio';

export interface AuditResult {
  id: string;
  title: string;
  description: string;
  score: number; // 0 to 1
  displayValue?: string;
  category: 'performance' | 'seo' | 'best-practices' | 'accessibility';
  details?: string;
}

export function runLighthouseAudits(html: string, pageLoadTimeMs: number): AuditResult[] {
  const $ = cheerio.load(html);
  const audits: AuditResult[] = [];

  // ==================== PERFORMANCE ====================
  // Audit 1: Time to First Byte & Load Time
  audits.push({
    id: 'load-speed',
    title: 'Page load time speed',
    description: 'Slower pages negatively impact search index rank and conversion rates.',
    score: pageLoadTimeMs < 1500 ? 1 : pageLoadTimeMs < 3000 ? 0.6 : 0.2,
    displayValue: `${(pageLoadTimeMs / 1000).toFixed(2)}s`,
    category: 'performance',
  });

  // Audit 2: DOM element count count
  const elementCount = $('*').length;
  audits.push({
    id: 'dom-size',
    title: 'Avoid an excessive DOM size',
    description: 'A large DOM will increase memory usage, cause longer style calculations, and produce costly layout reflows.',
    score: elementCount < 800 ? 1 : elementCount < 1500 ? 0.75 : 0.3,
    displayValue: `${elementCount} elements`,
    category: 'performance',
  });

  // ==================== SEO ====================
  // Audit 3: Title Length check
  const titleText = $('title').text().trim();
  let titleScore = 0;
  let titleDisplay = 'No Title Found';
  if (titleText.length > 0) {
    if (titleText.length >= 40 && titleText.length <= 60) {
      titleScore = 1;
    } else {
      titleScore = 0.5;
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
  });

  // Audit 4: Description Length check
  const descText = $('meta[name="description"]').attr('content')?.trim() || '';
  let descScore = 0;
  let descDisplay = 'No Description Found';
  if (descText.length > 0) {
    if (descText.length >= 110 && descText.length <= 160) {
      descScore = 1;
    } else {
      descScore = 0.6;
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
  });

  // Audit 5: H1 presence and duplicates
  const h1Count = $('h1').length;
  audits.push({
    id: 'seo-h1',
    title: 'Single H1 Heading Tag presence',
    description: 'Every web page should have a single H1 element representing the primary topic.',
    score: h1Count === 1 ? 1 : h1Count === 0 ? 0.3 : 0.5,
    displayValue: `${h1Count} tags`,
    category: 'seo',
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
  });

  // Audit 7: Image alt tags attributes
  const totalImages = $('img').length;
  let imagesWithAlt = 0;
  $('img').each((i, el) => {
    if ($(el).attr('alt') !== undefined) imagesWithAlt++;
  });
  audits.push({
    id: 'img-alts',
    title: 'Image elements have [alt] attributes',
    description: 'Informative alternative text improves search indexing and screen-reader accessibility.',
    score: totalImages === 0 ? 1 : parseFloat((imagesWithAlt / totalImages).toFixed(2)),
    displayValue: `${imagesWithAlt}/${totalImages} items`,
    category: 'accessibility',
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
