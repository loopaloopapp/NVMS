import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { queries, gscData, brandName = 'HydraSEO', competitor = 'Semrush' } = await req.json();

    const parseNumber = (value: unknown) => {
      if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
      if (typeof value === 'string') {
        const cleaned = value.replace(/[^\d\.\-]/g, '').trim();
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };

    const gscRows = Array.isArray(gscData)
      ? gscData
          .map((row: any) => ({
            query: typeof row?.query === 'string' ? row.query.trim() : '',
            clicks: parseNumber(row?.clicks),
            impressions: parseNumber(row?.impressions),
            position: parseNumber(row?.position),
            ctr: parseNumber(row?.ctr)
          }))
          .filter(row => row.query.length > 0)
      : [];

    let queryList: string[] = [];
    if (typeof queries === 'string') {
      queryList = queries
        .split('\n')
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0);
    }

    if (queryList.length === 0 && gscRows.length > 0) {
      queryList = gscRows.map(row => row.query);
    }

    if (queryList.length === 0) {
      queryList = [
        `best accounting software for smb`,
        `alternatives to ${competitor}`,
        `pricing ${brandName}`,
        `how does ${brandName} work`,
        `integrations ${brandName}`,
        `${brandName} reviews`
      ];
    }

    const normalizedBrand = brandName.trim().toLowerCase();
    const normalizedCompetitor = competitor.trim().toLowerCase();
    const baseDomain = `https://${brandName.toLowerCase().replace(/\s+/g, '')}.com`;

    const derivePosition = (query: string) => {
      if (query.includes('vs') || query.includes('alternative') || query.includes('compare')) return 4.5;
      if (query.includes('pricing') || query.includes('price') || query.includes('cost') || query.includes('plans')) return 2.8;
      if (query.includes('review') || query.includes('opinion') || query.includes('rating')) return 5.6;
      if (query.includes('how') || query.includes('guide') || query.includes('tutorial') || query.includes('what')) return 5.2;
      if (query.includes(normalizedBrand)) return 3.0;
      return 6.3;
    };

    const calculateImpressions = (position: number) => Math.max(35, Math.round(450 / Math.max(1, position)));
    const calculateCtr = (position: number) => Number(Math.max(2, Math.min(28, 24 - position * 2)).toFixed(1));

    const getQueryClassification = (query: string) => {
      const lower = query.toLowerCase();
      return {
        isBrandQuery: normalizedBrand.length > 0 && lower.includes(normalizedBrand),
        isCompetitorQuery: normalizedCompetitor.length > 0 && lower.includes(normalizedCompetitor),
        isComparison: /\b(vs|versus|compare|alternative|best alternative)\b/.test(lower),
        isPricing: /\b(price|pricing|cost|plans|subscription|quote)\b/.test(lower),
        isReview: /\b(review|opinion|rating|score|testimonial|feedback)\b/.test(lower),
        isInformational: /\b(how|what|why|guide|tutorial|learn|tips|best)\b/.test(lower)
      };
    };

    const results = queryList.map((q: string, idx: number) => {
      const normalized = q.trim();
      const row = gscRows.find(r => r.query.toLowerCase() === normalized.toLowerCase());
      const classification = getQueryClassification(normalized);

      const derivedPosition = row?.position ?? derivePosition(normalized.toLowerCase());
      const googlePosition = Number(derivedPosition.toFixed(1));
      const impressions = row?.impressions ?? calculateImpressions(googlePosition);
      const ctr = row?.ctr ?? calculateCtr(googlePosition);
      const clicks = row?.clicks ?? Math.max(1, Math.round(impressions * (ctr / 100)));

      const engines = new Set<string>();
      if (classification.isBrandQuery || classification.isPricing || classification.isInformational) engines.add('ChatGPT');
      if (classification.isComparison || classification.isPricing || classification.isBrandQuery) engines.add('Gemini');
      if (classification.isBrandQuery || classification.isInformational || classification.isCompetitorQuery) engines.add('Claude');
      if (classification.isComparison || classification.isReview || classification.isCompetitorQuery) engines.add('Perplexity');
      if (classification.isBrandQuery && googlePosition <= 5) engines.add('Copilot');
      if (engines.size === 0) engines.add('Perplexity');

      const citedEngines = Array.from(engines);
      const entityType = classification.isComparison
        ? 'competitor comparison'
        : classification.isPricing
          ? 'pricing'
          : classification.isReview
            ? 'reputation'
            : classification.isInformational
              ? 'feature'
              : normalized.includes(normalizedBrand)
                ? 'brand'
                : 'informational';
      const entityName = classification.isComparison
        ? `${brandName} vs ${competitor}`
        : classification.isPricing
          ? `${brandName} pricing plans`
          : classification.isReview
            ? 'external reviews'
            : classification.isInformational
              ? `${brandName} feature documentation`
              : `${brandName} brand page`;
      const citationMode = classification.isComparison
        ? 'comparison table'
        : classification.isPricing
          ? 'direct source'
          : classification.isReview
            ? 'brand mention'
            : classification.isInformational
              ? 'faq answer'
              : 'direct source';
      const citedUrl = classification.isComparison
        ? `${baseDomain}/compare-${competitor.toLowerCase().replace(/\s+/g, '-')}`
        : classification.isPricing
          ? `${baseDomain}/pricing`
          : classification.isReview
            ? `https://www.trustpilot.com/review/${brandName.toLowerCase().replace(/\s+/g, '')}`
            : classification.isInformational
              ? `${baseDomain}/features`
              : `${baseDomain}`;

      const seoOpportunity = Math.max(1, 11 - googlePosition);
      const organicDemand = Math.log10(Math.max(1, impressions));
      const aiCitationScore = (citedEngines.length / 5) * 100;
      const rawGap = (seoOpportunity * organicDemand * 25) - aiCitationScore;
      const geoGapScore = Math.min(100, Math.max(0, Math.round(rawGap)));

      let gapLevel = 'Low';
      if (geoGapScore > 70) gapLevel = 'High';
      else if (geoGapScore > 40) gapLevel = 'Medium';

      let recommendedAction = 'Monitor visibility and keep structured H1/H2 attributes updated.';
      if (gapLevel === 'High') {
        if (entityType === 'competitor comparison') {
          recommendedAction = `Create a dedicated comparison page for ${brandName} and ${competitor} with FAQ schema and clear CTA.`;
        } else if (entityType === 'reputation') {
          recommendedAction = 'Build more review-rich content and citation signals on authoritative review sites.';
        } else {
          recommendedAction = `Publish high-value content around "${normalized}" and add schema-rich answer blocks.`;
        }
      } else if (gapLevel === 'Medium') {
        recommendedAction = 'Improve page metadata and internal links to strengthen relevance for the query.';
      }

      return {
        id: `geo-${idx}`,
        query: normalized,
        googlePosition,
        clicks,
        impressions,
        ctr,
        engines: citedEngines,
        citedUrl,
        entityType,
        entityName,
        citationMode,
        geoGapScore,
        gapLevel,
        recommendedAction
      };
    });

    const totalQueries = results.length;
    const queriesWithAiCitation = results.filter(r => r.engines.length > 0).length;
    const aiCoverageRate = Math.round((queriesWithAiCitation / totalQueries) * 100);
    const highGapQueries = results.filter(r => r.gapLevel === 'High').length;
    const highGapRate = Math.round((highGapQueries / totalQueries) * 100);
    const citedEntities = new Set(results.filter(r => r.engines.length > 0).map(r => r.entityType));
    const entitiesCitedCount = citedEntities.size;

    const engineCitationCounts: Record<string, number> = {
      Perplexity: 0,
      ChatGPT: 0,
      Gemini: 0,
      Claude: 0,
      Copilot: 0
    };
    results.forEach(r => {
      r.engines.forEach((eng: string) => {
        const normalized = eng.toLowerCase();
        if (normalized.includes('perplexity')) engineCitationCounts.Perplexity++;
        else if (normalized.includes('chatgpt')) engineCitationCounts.ChatGPT++;
        else if (normalized.includes('gemini')) engineCitationCounts.Gemini++;
        else if (normalized.includes('claude')) engineCitationCounts.Claude++;
        else if (normalized.includes('copilot')) engineCitationCounts.Copilot++;
      });
    });

    const engineCoverage = Object.entries(engineCitationCounts).map(([engine, count]) => ({
      engine,
      coverage: Math.round((count / totalQueries) * 100),
      citationsCount: count
    }));

    const brandQueries = results.filter(r => r.query.toLowerCase().includes(normalizedBrand));
    const vsQueries = results.filter(r => /\b(vs|versus|compare|alternative)\b/.test(r.query.toLowerCase()));
    const priceQueries = results.filter(r => /\b(price|pricing|cost|plans|subscription)\b/.test(r.query.toLowerCase()));
    const infoQueries = results.filter(r => /\b(how|what|why|guide|tutorial|learn|tips)\b/.test(r.query.toLowerCase()));

    const clusters = [
      {
        name: `Brand / Navigational (${brandName})`,
        avgPosition: brandQueries.length > 0 ? (brandQueries.reduce((acc, curr) => acc + curr.googlePosition, 0) / brandQueries.length).toFixed(1) : '1.2',
        aiCitationRate: brandQueries.length > 0 ? Math.round((brandQueries.filter(r => r.engines.length > 0).length / brandQueries.length) * 100) : 85,
        gapLevel: brandQueries.length > 0 ? (brandQueries.reduce((acc,curr)=>acc+curr.geoGapScore,0)/brandQueries.length > 50 ? 'HIGH' : 'LOW') : 'LOW'
      },
      {
        name: `Comparison (vs ${competitor})`,
        avgPosition: vsQueries.length > 0 ? (vsQueries.reduce((acc, curr) => acc + curr.googlePosition, 0) / vsQueries.length).toFixed(1) : '4.8',
        aiCitationRate: vsQueries.length > 0 ? Math.round((vsQueries.filter(r => r.engines.length > 0).length / vsQueries.length) * 100) : 20,
        gapLevel: vsQueries.length > 0 ? (vsQueries.reduce((acc,curr)=>acc+curr.geoGapScore,0)/vsQueries.length > 50 ? 'HIGH' : 'LOW') : 'HIGH'
      },
      {
        name: 'Transactional & Pricing',
        avgPosition: priceQueries.length > 0 ? (priceQueries.reduce((acc, curr) => acc + curr.googlePosition, 0) / priceQueries.length).toFixed(1) : '2.3',
        aiCitationRate: priceQueries.length > 0 ? Math.round((priceQueries.filter(r => r.engines.length > 0).length / priceQueries.length) * 100) : 50,
        gapLevel: priceQueries.length > 0 ? (priceQueries.reduce((acc,curr)=>acc+curr.geoGapScore,0)/priceQueries.length > 50 ? 'HIGH' : 'MEDIUM') : 'MEDIUM'
      },
      {
        name: 'Informational & How-to',
        avgPosition: infoQueries.length > 0 ? (infoQueries.reduce((acc, curr) => acc + curr.googlePosition, 0) / infoQueries.length).toFixed(1) : '6.4',
        aiCitationRate: infoQueries.length > 0 ? Math.round((infoQueries.filter(r => r.engines.length > 0).length / infoQueries.length) * 100) : 35,
        gapLevel: infoQueries.length > 0 ? (infoQueries.reduce((acc,curr)=>acc+curr.geoGapScore,0)/infoQueries.length > 50 ? 'HIGH' : 'MEDIUM') : 'MEDIUM'
      }
    ];

    const siteEntities = [
      { name: 'Main Brand', frequency: 'High', description: 'Cited heavily on brand name queries and official domain homepage links.', status: 'stable' },
      { name: 'Features & Use Cases', frequency: 'Medium', description: 'Good coverage for how-to content, but deeper schema is needed.', status: 'warning' },
      { name: 'Pricing Page', frequency: 'Medium', description: 'Typically cited for pricing queries, but currency and plan details should be refreshed.', status: 'warning' },
      { name: 'FAQ & Help Center', frequency: 'Low', description: 'Low citation density; strong opportunity to add FAQPage JSON-LD.', status: 'opportunity' },
      { name: 'Competitor Comparisons', frequency: 'Critical', description: 'Missing direct comparison pages for top competitor queries.', status: 'critical' }
    ];

    return NextResponse.json({
      brandName,
      overallStats: {
        totalQueries,
        queriesWithAiCitations: aiCoverageRate,
        queriesWithHighGap: highGapRate,
        totalEntitiesCited: entitiesCitedCount
      },
      engineCoverage,
      clusters,
      matrix: results.map(r => ({
        query: r.query,
        gscPosition: r.googlePosition,
        gscClicks: r.clicks,
        citations: r.engines,
        gapScore: r.geoGapScore,
        gapLevel: r.gapLevel.toUpperCase(),
        recommendation: r.recommendedAction
      })),
      entitiesMapping: siteEntities
    });
  } catch (error: any) {
    console.error('GEO analysis error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during GEO analysis.' }, { status: 500 });
  }
}
