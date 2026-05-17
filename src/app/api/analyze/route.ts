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
    const renderedHtmlRes = await renderWithBrowser(url);
    const renderedMetadata = extractHeadMetadata(renderedHtmlRes.html);
    const renderedContent = extractContentSignals(renderedHtmlRes.html);

    const isCSRDependent = compareContent(initialContent, renderedContent);
    const metadataDiffs = compareMetadata(initialMetadata, renderedMetadata);

    const { score, issues } = calculateRiskScore(metadataDiffs, isCSRDependent);
    const severity = determineSeverityByScore(score);

    // Execute Lighthouse audit logic on rendered DOM
    const audits = runLighthouseAudits(renderedHtmlRes.html, renderedHtmlRes.metrics.loadTime);
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
