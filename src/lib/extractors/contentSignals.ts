import * as cheerio from 'cheerio';

export interface ContentSignals {
  bodyTextLength: number;
  firstMeaningfulText: string | null;
}

export function extractContentSignals(html: string): ContentSignals {
  const $ = cheerio.load(html);
  
  // Remove scripts, styles, and other non-visible elements
  $('script, style, noscript, iframe, svg, img, video, audio').remove();
  
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const bodyTextLength = bodyText.length;
  
  const firstMeaningfulText = bodyText.substring(0, 200) || null;

  return {
    bodyTextLength,
    firstMeaningfulText,
  };
}
