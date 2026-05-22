import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { sitemapUrl, currentScanPayload } = await req.json();

    if (!sitemapUrl) {
      return NextResponse.json({ error: 'Sitemap URL is required' }, { status: 400 });
    }

    // Fetch sitemap XML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s fetch timeout
    
    let xmlText = '';
    try {
      const res = await fetch(sitemapUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        return NextResponse.json({ error: `Failed to fetch sitemap: ${res.statusText}` }, { status: 400 });
      }
      xmlText = await res.text();
    } catch (err: any) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: `Fetch error: ${err.message || err}` }, { status: 500 });
    }

    // Parse XML using cheerio
    const discoveredUrls: string[] = [];
    try {
      const $ = cheerio.load(xmlText, { xmlMode: true });
      $('loc').each((_, el) => {
        const urlText = $(el).text().trim();
        if (urlText) {
          discoveredUrls.push(urlText);
        }
      });
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to parse sitemap XML: ${err.message || err}` }, { status: 400 });
    }

    // Map sitemap URLs by their pathnames for cross-origin matching
    const sitemapPathsMap = new Map<string, string>(); // pathname -> full production URL
    discoveredUrls.forEach(url => {
      try {
        const parsed = new URL(url);
        sitemapPathsMap.set(parsed.pathname, url);
      } catch {}
    });

    // Map scanned pages by their pathnames
    const currentScanPathsMap = new Map<string, any>(); // pathname -> scan result page
    (currentScanPayload || []).forEach((page: any) => {
      try {
        const parsed = new URL(page.url);
        currentScanPathsMap.set(parsed.pathname, page);
      } catch {}
    });

    // Calculate diff matrices
    const added: string[] = [];
    const deleted: string[] = [];
    const regressions: string[] = [];

    // Added: in scanned staging but not in sitemap
    currentScanPathsMap.forEach((page, pathname) => {
      if (!sitemapPathsMap.has(pathname)) {
        added.push(page.url);
      }
    });

    // Deleted: in sitemap but not in scanned staging
    sitemapPathsMap.forEach((originalUrl, pathname) => {
      if (!currentScanPathsMap.has(pathname)) {
        deleted.push(originalUrl);
      }
    });

    // Regressions: in both, but scanned staging has issues (critical/warning gaps, or high risk scores)
    currentScanPathsMap.forEach((page, pathname) => {
      if (sitemapPathsMap.has(pathname)) {
        const hasIssues = 
          page.isCSRDependent || 
          (page.issues && page.issues.length > 0) || 
          page.score > 20 || 
          (page.lighthouse?.scores?.performance && page.lighthouse.scores.performance < 75);

        if (hasIssues) {
          regressions.push(page.url);
        }
      }
    });

    return NextResponse.json({
      discoveredUrls,
      comparison: {
        added,
        deleted,
        regressions
      }
    });
  } catch (error: any) {
    console.error('Sitemap comparison error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during comparison.' }, { status: 500 });
  }
}
