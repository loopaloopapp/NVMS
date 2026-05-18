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

export async function POST(req: NextRequest) {
  try {
    const { url, options } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const initialHtmlRes = await fetchInitialHtml(url);
    const initialMetadata = extractHeadMetadata(initialHtmlRes.html);
    const initialContent = extractContentSignals(initialHtmlRes.html);
    const discoveredLinks = discoverLinks(initialHtmlRes.html, initialHtmlRes.finalUrl);

    // Apply filtering options
    let linksToReturn = discoveredLinks;
    if (options?.ignorePaths && options.ignorePaths.length > 0) {
      linksToReturn = linksToReturn.filter(link => {
        try {
          const lUrl = new URL(link);
          return !options.ignorePaths.some((p: string) => lUrl.pathname.startsWith(p));
        } catch { return true; }
      });
    }

    if (options?.excludeQueryString) {
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
    const renderedHtmlRes = await renderWithBrowser(url, initialHtmlRes.durationMs);
    const renderedHtml = renderedHtmlRes.html || initialHtmlRes.html;
    const renderedMetadata = extractHeadMetadata(renderedHtml);
    const renderedContent = extractContentSignals(renderedHtml);

    const isCSRDependent = compareContent(initialContent, renderedContent);
    const metadataDiffs = compareMetadata(initialMetadata, renderedMetadata);

    const { score, issues } = calculateRiskScore(metadataDiffs, isCSRDependent);
    const severity = determineSeverityByScore(score);

    const robotsResult = await checkRobotsTxt(url);

    // Execute Lighthouse audit logic on rendered DOM
    const audits = runLighthouseAudits(renderedHtml, renderedHtmlRes.metrics.loadTime, initialHtmlRes.finalUrl, robotsResult.isBlocked);
    const lhScores = calculateLighthouseScores(audits);

    return NextResponse.json({
      url,
      finalUrl: initialHtmlRes.finalUrl,
      status: initialHtmlRes.status,
      renderedStatus: renderedHtmlRes.status,
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
      }
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'An error occurred during analysis.' }, { status: 500 });
  }
}
