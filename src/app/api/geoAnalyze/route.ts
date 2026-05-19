import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { queries, gscData, brandName = 'HydraSEO', competitor = 'Semrush' } = await req.json();

    let queryList: string[] = [];

    // Parse input queries
    if (queries && typeof queries === 'string') {
      queryList = queries
        .split('\n')
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0);
    }

    // Default English queries if none are provided
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

    // Dynamic generation of query metrics
    const results = queryList.map((q: string, idx: number) => {
      const lowerQ = q.toLowerCase();
      
      let googlePosition = Number((2.0 + Math.random() * 8.0).toFixed(1));
      let clicks = Math.round(50 + Math.random() * 450);
      let impressions = Math.round(clicks * (8 + Math.random() * 12));
      let ctr = Number(((clicks / impressions) * 100).toFixed(1));

      let citedEngines: string[] = [];
      let citedUrl = '';
      let entityType = '—';
      let entityName = '—';
      let citationMode = '—';

      // Seed deterministic-looking simulated metrics based on query type
      if (lowerQ.includes('alternative') || lowerQ.includes('vs') || lowerQ.includes('compare')) {
        googlePosition = Number((4.0 + Math.random() * 2.0).toFixed(1));
        entityType = 'competitor comparison';
        entityName = 'comparative grid';
        if (Math.random() > 0.7) {
          citedEngines = ['Perplexity'];
          citedUrl = `https://${brandName.toLowerCase()}.com/compare`;
          citationMode = 'comparison table';
        } else {
          citedEngines = [];
          citationMode = 'None';
        }
      } else if (lowerQ.includes('pricing') || lowerQ.includes('cost') || lowerQ.includes('price')) {
        googlePosition = Number((1.5 + Math.random() * 1.5).toFixed(1));
        entityType = 'pricing';
        entityName = `${brandName} pricing plans`;
        citationMode = 'direct source';
        citedEngines = Math.random() > 0.4 ? ['ChatGPT', 'Gemini'] : ['ChatGPT'];
        citedUrl = `https://${brandName.toLowerCase()}.com/pricing`;
      } else if (lowerQ.includes('how') || lowerQ.includes('work') || lowerQ.includes('guide') || lowerQ.includes('tutorial')) {
        googlePosition = Number((5.0 + Math.random() * 4.0).toFixed(1));
        entityType = 'feature';
        entityName = `${brandName} workflow automation`;
        citationMode = 'faq answer';
        citedEngines = ['Perplexity', 'ChatGPT', 'Gemini'];
        citedUrl = `https://${brandName.toLowerCase()}.com/features`;
      } else if (lowerQ.includes('review') || lowerQ.includes('opinion') || lowerQ.includes('expert')) {
        googlePosition = Number((6.0 + Math.random() * 3.5).toFixed(1));
        entityType = 'reputation';
        entityName = 'external reviews';
        citationMode = 'brand mention';
        citedEngines = ['Perplexity'];
        citedUrl = `https://www.trustpilot.com/review/${brandName.toLowerCase()}`;
      } else if (lowerQ.includes('integration') || lowerQ.includes('api') || lowerQ.includes('connect')) {
        googlePosition = Number((3.0 + Math.random() * 4.0).toFixed(1));
        entityType = 'feature';
        entityName = 'integration hub';
        citationMode = 'None';
        citedEngines = [];
      } else {
        // Generic / Brand query
        googlePosition = Number((1.0 + Math.random() * 1.5).toFixed(1));
        entityType = 'brand';
        entityName = brandName;
        citationMode = 'direct source';
        citedEngines = ['Perplexity', 'ChatGPT', 'Gemini', 'Claude', 'Copilot'];
        citedUrl = `https://${brandName.toLowerCase()}.com`;
      }

      // Calculate GEO Gap Index: ((SEO Opportunity * Organic Demand) - AI Citation Score)
      // SEO Opportunity Score = 11 - googlePosition (higher value = page 1 opportunity)
      const seoOpportunity = Math.max(1, 11 - googlePosition);
      // Organic demand index = log10 of impressions
      const organicDemand = Math.log10(impressions || 100);
      // AI Citation score = cited engines out of 5 * 100
      const aiCitationScore = (citedEngines.length / 5) * 100;
      
      // Calculate gap index (0 - 100)
      const rawGap = ((seoOpportunity * organicDemand * 25) - aiCitationScore);
      const geoGapScore = Math.min(100, Math.max(0, Math.round(rawGap)));
      
      let gapLevel = 'Low';
      if (geoGapScore > 70) gapLevel = 'High';
      else if (geoGapScore > 40) gapLevel = 'Medium';

      let recommendedAction = 'optimize schema tags';
      if (gapLevel === 'High') {
        if (entityType === 'competitor comparison') {
          recommendedAction = `create native comparison page "/compare/${competitor.toLowerCase()}" + FAQ schema`;
        } else if (entityType === 'reputation') {
          recommendedAction = 'encourage customers to leave review citations on external authoritative sites';
        } else {
          recommendedAction = `publish high-authority informational page focused on "${q}" keywords`;
        }
      } else if (gapLevel === 'Medium') {
        recommendedAction = 'implement Product JSON-LD markup and refine canonical URL redirects';
      } else {
        recommendedAction = 'monitor visibility and keep structured H1/H2 attributes updated';
      }

      return {
        id: `geo-${idx}`,
        query: q,
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

    // Overview numbers
    const totalQueries = results.length;
    const queriesWithAiCitation = results.filter(r => r.engines.length > 0).length;
    const aiCoverageRate = Math.round((queriesWithAiCitation / totalQueries) * 100);
    const highGapQueries = results.filter(r => r.gapLevel === 'High').length;
    const highGapRate = Math.round((highGapQueries / totalQueries) * 100);
    
    // Count distinct entities cited
    const citedEntities = new Set(results.filter(r => r.engines.length > 0).map(r => r.entityType));
    const entitiesCitedCount = Math.max(4, citedEntities.size + 2); // simulated variety count

    // Coverage per engine counts
    const engineCitationCounts: Record<string, number> = {
      perplexity: 0,
      chatgpt: 0,
      gemini: 0,
      claude: 0,
      copilot: 0
    };
    results.forEach(r => {
      r.engines.forEach((eng: string) => {
        const key = eng.toLowerCase();
        if (key.includes('perplexity')) engineCitationCounts.perplexity++;
        else if (key.includes('chatgpt')) engineCitationCounts.chatgpt++;
        else if (key.includes('gemini')) engineCitationCounts.gemini++;
        else if (key.includes('claude')) engineCitationCounts.claude++;
        else if (key.includes('copilot') || key.includes('microsoft')) engineCitationCounts.copilot++;
      });
    });

    const engineCoverage = Object.entries(engineCitationCounts).map(([engine, count]) => {
      const rate = Math.round((count / totalQueries) * 100);
      return {
        engine: engine.charAt(0).toUpperCase() + engine.slice(1),
        rate,
        count
      };
    });

    // Dynamic query clustering based on analyzed query types
    const brandQueries = results.filter(r => r.query.toLowerCase().includes(brandName.toLowerCase()));
    const vsQueries = results.filter(r => r.query.toLowerCase().includes('vs') || r.query.toLowerCase().includes('alternative') || r.query.toLowerCase().includes('compare'));
    const priceQueries = results.filter(r => r.query.toLowerCase().includes('pricing') || r.query.toLowerCase().includes('price') || r.query.toLowerCase().includes('cost'));
    const infoQueries = results.filter(r => r.query.toLowerCase().includes('how') || r.query.toLowerCase().includes('what') || r.query.toLowerCase().includes('guide') || r.query.toLowerCase().includes('tutorial'));

    const clusters = [
      {
        name: `Brand / Navigational (${brandName})`,
        organicPos: brandQueries.length > 0 ? (brandQueries.reduce((acc, curr) => acc + curr.googlePosition, 0) / brandQueries.length).toFixed(1) : '1.2',
        aiCitation: brandQueries.length > 0 ? `${Math.round((brandQueries.filter(r => r.engines.length > 0).length / brandQueries.length) * 100)}%` : '85%',
        gap: brandQueries.length > 0 ? (brandQueries.reduce((acc, curr) => acc + curr.geoGapScore, 0) / brandQueries.length > 50 ? 'High' : 'Low') : 'Low'
      },
      {
        name: `Comparison (vs ${competitor})`,
        organicPos: vsQueries.length > 0 ? (vsQueries.reduce((acc, curr) => acc + curr.googlePosition, 0) / vsQueries.length).toFixed(1) : '4.8',
        aiCitation: vsQueries.length > 0 ? `${Math.round((vsQueries.filter(r => r.engines.length > 0).length / vsQueries.length) * 100)}%` : '20%',
        gap: vsQueries.length > 0 ? (vsQueries.reduce((acc, curr) => acc + curr.geoGapScore, 0) / vsQueries.length > 50 ? 'High' : 'Low') : 'High'
      },
      {
        name: 'Transactional & Pricing',
        organicPos: priceQueries.length > 0 ? (priceQueries.reduce((acc, curr) => acc + curr.googlePosition, 0) / priceQueries.length).toFixed(1) : '2.3',
        aiCitation: priceQueries.length > 0 ? `${Math.round((priceQueries.filter(r => r.engines.length > 0).length / priceQueries.length) * 100)}%` : '50%',
        gap: priceQueries.length > 0 ? (priceQueries.reduce((acc, curr) => acc + curr.geoGapScore, 0) / priceQueries.length > 50 ? 'High' : 'Medium') : 'Medium'
      },
      {
        name: 'Informational & How-to',
        organicPos: infoQueries.length > 0 ? (infoQueries.reduce((acc, curr) => acc + curr.googlePosition, 0) / infoQueries.length).toFixed(1) : '6.4',
        aiCitation: infoQueries.length > 0 ? `${Math.round((infoQueries.filter(r => r.engines.length > 0).length / infoQueries.length) * 100)}%` : '35%',
        gap: infoQueries.length > 0 ? (infoQueries.reduce((acc, curr) => acc + curr.geoGapScore, 0) / infoQueries.length > 50 ? 'High' : 'Medium') : 'Medium'
      }
    ];

    // Entity mapping site citations details
    const siteEntities = [
      { name: 'Main Brand', frequency: 'High', description: 'Cited heavily on brand name queries and official domain homepage links.', status: 'stable' },
      { name: 'Features & Use Cases', frequency: 'Medium', description: 'Excellent coverage for how-to questions but missing deep canonical deep-linking.', status: 'warning' },
      { name: 'Pricing Page', frequency: 'Medium', description: 'Often cited, but LLMs occasionally recommend outdated price quotes from blog posts.', status: 'warning' },
      { name: 'FAQ & Help Center', frequency: 'Low', description: 'Extremely low crawl reference. Opportunity to inject FAQPage JSON-LD schemas.', status: 'opportunity' },
      { name: 'Competitor Comparisons', frequency: 'Critical', description: 'Almost completely absent. Priority cluster for GEO gap resolution.', status: 'critical' }
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
