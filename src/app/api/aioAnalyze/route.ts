import { NextRequest, NextResponse } from 'next/server';
import { fetchInitialHtml } from '@/lib/analyzer/fetchInitialHtml';
import * as cheerio from 'cheerio';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { brandName, industry, competitors, url, engines } = await req.json();

    if (!brandName) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }
    if (!industry) {
      return NextResponse.json({ error: 'Industry sector is required' }, { status: 400 });
    }

    const competitorList = competitors 
      ? competitors.split(',').map((c: string) => c.trim()).filter(Boolean)
      : ['Competitor A', 'Competitor B'];

    const selectedEngines = engines && engines.length > 0
      ? engines
      : ['chatgpt', 'gemini', 'claude', 'perplexity', 'copilot'];

    // 1. Crawl Brand URL if present
    let crawledTitle = '';
    let crawledDescription = '';
    let crawledHeadings: string[] = [];
    let detectedKeywords: string[] = [];

    if (url) {
      try {
        let resolvedUrl = url.trim();
        if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) {
          resolvedUrl = 'https://' + resolvedUrl;
        }
        
        const fetchRes = await fetchInitialHtml(resolvedUrl);
        if (fetchRes.status === 200) {
          const $ = cheerio.load(fetchRes.html);
          crawledTitle = $('title').text().trim();
          crawledDescription = $('meta[name="description"]').attr('content')?.trim() || '';
          
          $('h1, h2').slice(0, 5).each((_, el) => {
            const text = $(el).text().trim();
            if (text) crawledHeadings.push(text);
          });

          // Super basic keyword extractor
          const bodyText = $('body').text().toLowerCase();
          const words = bodyText.match(/\b[a-zA-Zàèìòù]{4,15}\b/g) || [];
          const stopWords = new Set(['questo', 'quello', 'della', 'delle', 'dello', 'nella', 'nelle', 'nello', 'tutto', 'tutti', 'come', 'sono', 'sito', 'web', 'page', 'home', 'with', 'from', 'this', 'that', 'your']);
          const wordCounts: Record<string, number> = {};
          
          words.forEach(w => {
            if (!stopWords.has(w) && w.length > 3) {
              wordCounts[w] = (wordCounts[w] || 0) + 1;
            }
          });

          detectedKeywords = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(entry => entry[0]);
        }
      } catch (err) {
        console.error('Cheerio/Crawling error in AIO scan:', err);
      }
    }

    // 2. Real API Integration: Ask OpenAI to evaluate AIO metrics based on scraped signals
    const openApiKey = process.env.OPENAI_API_KEY;
    
    if (!openApiKey) {
      return NextResponse.json({ 
        error: 'OPENAI_API_KEY is missing. Real analysis requires an active OpenAI API key in .env.local.' 
      }, { status: 500 });
    }

    const descriptionContext = crawledDescription || `Platform focused on ${industry}`;
    const cleanKeywords = detectedKeywords.length > 0 ? detectedKeywords : ['optimization', 'technology', 'efficiency'];

    const promptText = `
You are an expert AI Search & AIO (Artificial Intelligence Optimization) Analyst.
The user wants to perform a real Generative Engine Audit for their brand.
Analyze how LLMs currently perceive and generate content about this brand compared to competitors.

Inputs:
Brand Name: ${brandName}
Industry: ${industry}
Competitors: ${competitorList.join(', ')}
Brand URL: ${url || 'Not provided'}
Website Scraped Content: 
- Title: ${crawledTitle}
- Description: ${descriptionContext}
- Headings: ${crawledHeadings.join(' | ')}
- Top Keywords: ${cleanKeywords.join(', ')}

Engines to evaluate: ${selectedEngines.join(', ')}

Output a valid JSON matching this structure perfectly:
{
  "overallMetrics": {
    "shareOfVoice": <number 0-100>,
    "visibilityIndex": <number 0-10, 1 decimal>,
    "sentimentPositive": <number 0-100>,
    "sentimentNeutral": <number 0-100>,
    "sentimentNegative": <number 0-100>,
    "citationRate": <number 0-100>
  },
  "engineSoV": [
    { "engine": "<e.g. ChatGPT (GPT-4o)>", "sov": <number 0-100>, "citations": <number> }
  ],
  "competitorMetrics": [
    { "name": "competitorName", "shareOfVoice": <number>, "visibilityIndex": <number>, "sentiment": <number> }
  ],
  "narrativeProfile": {
    "narrativeSummary": "<text>",
    "brandAttributes": [
      { "name": "<attribute concept>", "description": "<text>", "positive": <boolean> }
    ]
  },
  "prompts": [
    {
      "id": "p1",
      "prompt": "<simulate a realistic query a user would ask an LLM in this industry>",
      "engine": "<e.g., ChatGPT (GPT-4o) or Gemini (1.5 Pro)>",
      "response": "<simulate the actual LLM response. Use markdown formatting>",
      "sentiment": "<positive|neutral|negative>",
      "citationStatus": "<cited|missing>",
      "citationUrl": "<url or empty>",
      "positioning": "<primary|secondary>",
      "keyTakeaway": "<Strategic takeaway from this specific response>",
      "mentionedCompetitors": ["<comp1>"],
      "category": "<e.g. Technical Performance>"
    }
  ],
  "aioRecommendations": [
    { "id": "rec1", "title": "<title>", "description": "<desc>", "impact": "<high|medium|low>", "difficulty": "<easy|medium|hard>", "action": "<action>" }
  ]
}

Make sure to generate EXACTLY one prompt object in the 'prompts' array for EACH engine specified in 'Engines to evaluate'.
Be highly analytical and realistic. If the brand is unknown or small, reflect that in lower shareOfVoice and "missing" citations.
Return ONLY a valid JSON object without markdown codeblocks or extra text.
`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: promptText }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error("OpenAI Error:", err);
      throw new Error(`Failed to generate real analysis from OpenAI: ${err}`);
    }

    const aiData = await aiResponse.json();
    const parsedData = JSON.parse(aiData.choices[0].message.content);

    // Map prompts to frontend expected structure
    const mappedPrompts = parsedData.prompts.map((p: any) => ({
      ...p,
      citesBrand: p.citationStatus === 'cited',
      rankPosition: p.positioning === 'primary' ? 1 : (p.positioning === 'secondary' ? 2 : 'N/A'),
      responseHtml: p.response,
      citationsFound: p.citationUrl || 'None',
      mentionedCompetitors: Array.isArray(p.mentionedCompetitors) ? p.mentionedCompetitors : []
    }));

    const narratives = parsedData.narrativeProfile.brandAttributes.map((attr: any) => ({
        concept: attr.name,
        frequency: Math.round(50 + Math.random() * 40),
        sentiment: attr.positive ? 'positive' : 'negative'
    }));

    const mappedRecommendations = parsedData.aioRecommendations.map((rec: any) => ({
        action: rec.title,
        details: rec.description
    }));

    return NextResponse.json({
      brandName,
      industry,
      competitors: competitorList,
      url,
      scannedMetadata: url ? {
        title: crawledTitle,
        description: descriptionContext,
        headings: crawledHeadings,
        detectedKeywords: cleanKeywords
      } : null,
      shareOfVoice: parsedData.overallMetrics.shareOfVoice,
      sentimentScore: parsedData.overallMetrics.sentimentPositive,
      citationsCount: parsedData.overallMetrics.citationRate,
      sentimentStatus: parsedData.overallMetrics.sentimentPositive > 70 ? 'Leading' : 'Emerging',
      engineSoV: parsedData.engineSoV,
      narratives,
      prompts: mappedPrompts,
      recommendations: mappedRecommendations,
      overallMetrics: parsedData.overallMetrics,
      competitorMetrics: parsedData.competitorMetrics,
      narrativeProfile: parsedData.narrativeProfile
    });

  } catch (error: any) {
    console.error('AIO analysis error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during AIO analysis.' }, { status: 500 });
  }
}
