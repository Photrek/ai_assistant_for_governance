import * as cheerio from 'cheerio';
import axios from 'axios';

export const searchDomain = async (domain: string) => {
  try {
    const response = await axios.get(`https://reactproxy.bakon.dev/scrape`, {
      params: { url: domain }
    });
    const html = response.data;
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