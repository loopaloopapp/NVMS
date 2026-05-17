export async function fetchInitialHtml(url: string): Promise<{ html: string; status: number; redirected: boolean; finalUrl: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
    });
    
    const html = await response.text();
    return {
      html,
      status: response.status,
      redirected: response.redirected,
      finalUrl: response.url,
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch initial HTML: ${error.message}`);
  }
}
