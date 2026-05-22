import { NextRequest, NextResponse } from 'next/server';
import { fetchInitialHtml } from '@/lib/analyzer/fetchInitialHtml';
import { renderWithBrowser } from '@/lib/analyzer/renderWithBrowser';
import { extractHeadMetadata } from '@/lib/extractors/headMetadata';
import { extractContentSignals } from '@/lib/extractors/contentSignals';
import { discoverLinks } from '@/lib/crawler/discovery';
import { compareMetadata, compareContent } from '@/lib/compare/metadataDiff';
import { calculateRiskScore, determineSeverityByScore } from '@/lib/scoring/seoRiskScore';
import { runLighthouseAudits, calculateLighthouseScores } from '@/lib/extractors/lighthouseAudits';

export const maxDuration = 300;

async function checkRobotsTxt(url: string): Promise<{ isBlocked: boolean; rules: string[] }> {
  try {
    const parsedUrl = new URL(url);
    const robotsUrl = `${parsedUrl.origin}/robots.txt`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(robotsUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      return { isBlocked: false, rules: [] };
    }
    
    const text = await res.text();
    const lines = text.split('\n');
    
    let isUserAgentMatch = false;
    const disallows: string[] = [];
    
    for (let line of lines) {
      line = line.trim();
      if (line.toLowerCase().startsWith('user-agent:')) {
        const ua = line.split(':')[1]?.trim() || '';
        isUserAgentMatch = (ua === '*' || ua.toLowerCase() === 'googlebot');
      } else if (isUserAgentMatch && line.toLowerCase().startsWith('disallow:')) {
        const rule = line.split(':')[1]?.trim() || '';
        if (rule) disallows.push(rule);
      }
    }
    
    const pathname = parsedUrl.pathname;
    const isBlocked = disallows.some(rule => {
      if (rule === '/') return true;
      const normalizedRule = rule.endsWith('/') ? rule : rule + '/';
      const normalizedPath = pathname.endsWith('/') ? pathname : pathname + '/';
      return normalizedPath.startsWith(normalizedRule) || pathname.startsWith(rule);
    });
    
    return { isBlocked, rules: disallows };
  } catch {
    return { isBlocked: false, rules: [] };
  }
}

async function analyzeSinglePage(
  pageUrl: string,
  initialUrl: string,
  ignorePaths: string[] = [],
  excludeQueryString: boolean = false
) {
  const initialHtmlRes = await fetchInitialHtml(pageUrl);
  const initialMetadata = extractHeadMetadata(initialHtmlRes.html);
  const initialContent = extractContentSignals(initialHtmlRes.html);
  const discoveredLinks = discoverLinks(initialHtmlRes.html, initialHtmlRes.finalUrl || pageUrl);

  // Apply filtering options
  let linksToReturn = discoveredLinks;
  if (ignorePaths.length > 0) {
    linksToReturn = linksToReturn.filter(link => {
      try {
        const lUrl = new URL(link);
        return !ignorePaths.some((p: string) => lUrl.pathname.startsWith(p));
      } catch { return true; }
    });
  }

  if (excludeQueryString) {
    linksToReturn = linksToReturn.map(link => {
      try {
        const lUrl = new URL(link);
        lUrl.search = '';
        return lUrl.href;
      } catch { return link; }
    });
    linksToReturn = Array.from(new Set(linksToReturn));
  }

  // Launch Playwright for full render & performance audits
  const renderedHtmlRes = await renderWithBrowser(pageUrl, initialHtmlRes.durationMs);
  const renderedHtml = renderedHtmlRes.html || initialHtmlRes.html;
  const renderedMetadata = extractHeadMetadata(renderedHtml);
  const renderedContent = extractContentSignals(renderedHtml);

  const isCSRDependent = compareContent(initialContent, renderedContent);
  const metadataDiffs = compareMetadata(initialMetadata, renderedMetadata);

  const { score, issues } = calculateRiskScore(metadataDiffs, isCSRDependent);
  const severity = determineSeverityByScore(score);

  const robotsResult = await checkRobotsTxt(pageUrl);

  // Execute Lighthouse audit logic on rendered DOM
  const audits = runLighthouseAudits(renderedHtml, renderedHtmlRes.metrics.loadTime, initialHtmlRes.finalUrl || pageUrl, robotsResult.isBlocked);
  const lhScores = calculateLighthouseScores(audits);

  return {
    url: pageUrl,
    finalUrl: initialHtmlRes.finalUrl || pageUrl,
    status: initialHtmlRes.status,
    renderedStatus: renderedHtmlRes.status || initialHtmlRes.status,
    initialMetadata,
    renderedMetadata,
    diffs: metadataDiffs,
    isCSRDependent,
    issues,
    score,
    severity,
    discoveredLinks: linksToReturn,
    performanceMetrics: renderedHtmlRes.metrics,
    lighthouse: {
      scores: lhScores,
      audits: audits
    },
    ssrHtml: initialHtmlRes.html,
    clientHtml: renderedHtml,
    ssr: {
      title: initialMetadata.title?.value || '',
      description: initialMetadata.description?.value || ''
    },
    csr: {
      title: renderedMetadata.title?.value || '',
      description: renderedMetadata.description?.value || ''
    }
  };
}

async function crawlSite(
  startUrl: string, 
  limit: number, 
  sameHostOnly: boolean, 
  excludeQueryString: boolean, 
  ignorePathsList: string[]
) {
  const pages: any[] = [];
  const visited = new Set<string>();
  const queue: string[] = [startUrl];
  
  let host: string | null = null;
  try {
    host = new URL(startUrl).host;
  } catch {}

  while (queue.length > 0 && pages.length < limit) {
    const currentUrl = queue.shift()!;
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      const pageResult = await analyzeSinglePage(currentUrl, startUrl, ignorePathsList, excludeQueryString);
      pages.push(pageResult);

      // Queue new discovered links if we haven't hit the limit yet
      if (pages.length < limit) {
        for (const link of pageResult.discoveredLinks) {
          try {
            const parsedLink = new URL(link);
            
            // Check same host rule
            if (sameHostOnly && host && parsedLink.host !== host) {
              continue;
            }

            // Standardize URL
            let targetUrl = link;
            if (excludeQueryString) {
              parsedLink.search = '';
              targetUrl = parsedLink.href;
            }

            if (!visited.has(targetUrl) && !queue.includes(targetUrl)) {
              queue.push(targetUrl);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error(`Error crawling ${currentUrl}:`, err);
    }
  }

  return pages;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const limitStr = searchParams.get('limit');
    const sameHostOnlyStr = searchParams.get('sameHostOnly');
    const excludeQueryStringStr = searchParams.get('excludeQueryString');
    const ignorePathsStr = searchParams.get('ignorePaths');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 1;
    const sameHostOnly = sameHostOnlyStr !== 'false';
    const excludeQueryString = excludeQueryStringStr !== 'false';
    const ignorePathsList = ignorePathsStr ? ignorePathsStr.split(',').map(p => p.trim()).filter(Boolean) : [];

    const pages = await crawlSite(url, limit, sameHostOnly, excludeQueryString, ignorePathsList);

    return NextResponse.json({
      pages,
      referrals: {}
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'An error occurred during analysis.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url, options } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const limit = options?.limit || 1;
    const sameHostOnly = options?.sameHostOnly !== false;
    const excludeQueryString = options?.excludeQueryString !== false;
    
    let ignorePathsList: string[] = [];
    if (options?.ignorePaths) {
      if (Array.isArray(options.ignorePaths)) {
        ignorePathsList = options.ignorePaths;
      } else if (typeof options.ignorePaths === 'string') {
        ignorePathsList = options.ignorePaths.split(',').map((p: string) => p.trim()).filter(Boolean);
      }
    }

    const pages = await crawlSite(url, limit, sameHostOnly, excludeQueryString, ignorePathsList);

    return NextResponse.json({
      pages,
      referrals: {}
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'An error occurred during analysis.' }, { status: 500 });
  }
}
