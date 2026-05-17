import * as cheerio from 'cheerio';

export interface Metadata {
  title: { value: string | null; present: boolean };
  description: { value: string | null; present: boolean };
  canonical: { value: string | null; present: boolean };
  robots: { value: string | null; present: boolean };
  hreflang: { value: string[]; present: boolean };
  og: {
    title: { value: string | null; present: boolean };
    description: { value: string | null; present: boolean };
    image: { value: string | null; present: boolean };
    url: { value: string | null; present: boolean };
  };
  twitter: {
    title: { value: string | null; present: boolean };
    description: { value: string | null; present: boolean };
    image: { value: string | null; present: boolean };
    card: { value: string | null; present: boolean };
  };
  jsonLd: { present: boolean; contents: string[] };
}

export function extractHeadMetadata(html: string): Metadata {
  const $ = cheerio.load(html);

  const titleText = $('title').text().trim();
  const title = {
    value: titleText || null,
    present: $('title').length > 0,
  };

  const descriptionContent = $('meta[name="description"]').attr('content')?.trim();
  const description = {
    value: descriptionContent || null,
    present: $('meta[name="description"]').length > 0,
  };

  const canonicalHref = $('link[rel="canonical"]').attr('href')?.trim();
  const canonical = {
    value: canonicalHref || null,
    present: $('link[rel="canonical"]').length > 0,
  };

  const robotsContent = $('meta[name="robots"]').attr('content')?.trim();
  const robots = {
    value: robotsContent || null,
    present: $('meta[name="robots"]').length > 0,
  };

  const hreflangEls = $('link[rel="alternate"][hreflang]');
  const hreflang = {
    value: hreflangEls.map((i, el) => $(el).attr('hreflang')).get(),
    present: hreflangEls.length > 0,
  };

  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || null;
  const ogDesc = $('meta[property="og:description"]').attr('content')?.trim() || null;
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim() || null;
  const ogUrl = $('meta[property="og:url"]').attr('content')?.trim() || null;

  const twTitle = $('meta[name="twitter:title"]').attr('content')?.trim() || null;
  const twDesc = $('meta[name="twitter:description"]').attr('content')?.trim() || null;
  const twImage = $('meta[name="twitter:image"]').attr('content')?.trim() || null;
  const twCard = $('meta[name="twitter:card"]').attr('content')?.trim() || null;

  const jsonLdScripts = $('script[type="application/ld+json"]');
  const jsonLd = {
    present: jsonLdScripts.length > 0,
    contents: jsonLdScripts.map((i, el) => $(el).html() || '').get(),
  };

  return {
    title,
    description,
    canonical,
    robots,
    hreflang,
    og: {
      title: { value: ogTitle, present: $('meta[property="og:title"]').length > 0 },
      description: { value: ogDesc, present: $('meta[property="og:description"]').length > 0 },
      image: { value: ogImage, present: $('meta[property="og:image"]').length > 0 },
      url: { value: ogUrl, present: $('meta[property="og:url"]').length > 0 },
    },
    twitter: {
      title: { value: twTitle, present: $('meta[name="twitter:title"]').length > 0 },
      description: { value: twDesc, present: $('meta[name="twitter:description"]').length > 0 },
      image: { value: twImage, present: $('meta[name="twitter:image"]').length > 0 },
      card: { value: twCard, present: $('meta[name="twitter:card"]').length > 0 },
    },
    jsonLd,
  };
}
