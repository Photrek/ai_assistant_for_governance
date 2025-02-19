import { AgentWebsearch } from "../generated-typings";
import * as cheerio from 'cheerio';

const agent_websearch: AgentWebsearch = (JWT, domain_name, query) => {
  return Promise.resolve(searchDomain(domain_name, query));
};

export const searchDomain = async (domain: string, query: string, maxDepth = 3, maxLinks = 50) => {
  try {
    const visited = new Set<string>();
    const results: { url: string; title: string; metadata: Record<string, string>; content: string[] }[] = [];
    const baseUrl = new URL(domain).origin;
    const queryTerms = query.toLowerCase()
      .replace(/can you give me information on/i, '')
      .match(/\w+/g) || [query.toLowerCase()];
    console.log('Starting scrape for domain:', domain, 'with query terms:', queryTerms);

    const scrapePage = async (url: string, depth: number): Promise<void> => {
      if (depth > maxDepth || visited.size >= maxLinks || visited.has(url)) {
        console.log(`Skipping ${url}: depth=${depth}, visited=${visited.size}`);
        return;
      }
      visited.add(url);
      console.log(`Scraping: ${url} at depth ${depth}`);

      let response;
      try {
        response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });
      } catch (fetchError) {
        console.error(`Fetch error for ${url}:`, fetchError);
        return;
      }
      if (!response.ok) {
        console.error(`Failed to fetch ${url}: ${response.statusText}`);
        return;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      console.log(`Fetched ${url}, HTML length: ${html.length}`);

      const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
      console.log(`Title for ${url}: ${title}`);

      const metadata: Record<string, string> = {};
      $('meta').each((_, el) => {
        const name = $(el).attr('name') || $(el).attr('property');
        const content = $(el).attr('content');
        if (name && content) metadata[name] = content;
      });

      const contentElements = $('p, h1, h2, h3, h4, h5, h6, li, div, article')
        .filter((_, el) => $(el).text().trim().length > 10)
        .map((_, el) => $(el).text().trim())
        .get();
      console.log(`Found ${contentElements.length} content elements at ${url}`);

      const isRelevant = queryTerms.some(t => 
        url.toLowerCase().includes(t) || 
        title.toLowerCase().includes(t) || 
        contentElements.some(c => c.toLowerCase().includes(t))
      );

      if (isRelevant) {
        results.push({
          url,
          title,
          metadata,
          content: contentElements.filter(c => queryTerms.some(t => c.toLowerCase().includes(t)))
        });
        console.log(`Added result for ${url}`);
      }

      // Collect all recursive scrape promises
      const scrapePromises: Promise<void>[] = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          let absoluteUrl;
          try {
            absoluteUrl = new URL(href, baseUrl).href;
          } catch (e) {
            console.log(`Invalid URL: ${href}`);
            return;
          }
          if (absoluteUrl.startsWith(baseUrl) && !visited.has(absoluteUrl)) {
            const linkText = $(el).text().toLowerCase();
            const linkUrl = absoluteUrl.toLowerCase();
            if (queryTerms.some(t => linkText.includes(t) || linkUrl.includes(t)) || depth < maxDepth) {
              console.log(`Following link: ${absoluteUrl}`);
              scrapePromises.push(scrapePage(absoluteUrl, depth + 1));
            }
          }
        }
      });

      // Wait for all subpage scrapes to complete
      await Promise.all(scrapePromises);
    };

    await scrapePage(domain, 0);
    console.log('Scraping complete. Results:', results);
    return JSON.stringify(results, null, 2);
  } catch (error) {
    console.error('Error scraping domain:', error);
    return JSON.stringify([]);
  }
};

export default agent_websearch;