import * as cheerio from 'cheerio';

export const searchDomain = async (domain: string) => {
  try {
    const response = await fetch(`https://reactproxy.bakon.dev/scrape?url=${encodeURIComponent(domain)}`, {
      method: 'GET',
      mode: 'cors', // explicitly set to cors
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch the page: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const data: string[] = [];

    // Example: Extract all paragraphs and headings
    $('p').each((_, element) => {
      data.push($(element).text());
    });
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      data.push($(element).text());
    });

    return data.join('\n');
  } catch (error) {
    console.error('Error scraping domain:', error);
    return '';
  }
};