import * as cheerio from 'cheerio';

export function discoverLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  
  try {
    const base = new URL(baseUrl);
    
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      // Ignore anchor links, mailto, tel, javascript, etc.
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
      }
      
      try {
        const url = new URL(href, base.href);
        // Only keep same origin
        if (url.origin === base.origin) {
          // Normalize by removing hash
          url.hash = '';
          links.add(url.href);
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    });
  } catch (e) {
    // Ignore base URL errors
  }
  
  return Array.from(links);
}
