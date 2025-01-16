import * as fs from "fs/promises";
import axios from "axios";
import { JSDOM } from "jsdom";
import { URL } from "url";

interface FineTuneData {
  prompt: string;
  completion: string;
}
let baseUrl: string;

// baseUrl = "https://docs.cardano.org/";
// baseUrl = "https://cips.cardano.org/";
// baseUrl = "https://www.essentialcardano.io/";
// baseUrl = "https://www.emurgo.io/";
// baseUrl = "https://iohk.io/en/research/library/";
// baseUrl = "https://iohk.io/";
baseUrl = "https://pluts.harmoniclabs.tech/";

const directory = "./src/training_data/raw_json/";
const filename = `${baseUrl.replace(/^https:\/\//, '').replace(/\//g, '')}.json`;

const initializeCrawl = (startUrl: string): [string, Set<string>] => {
  return [startUrl, new Set()];
};

const shouldCrawl = (url: string, visited: Set<string>): boolean => {
  return !visited.has(url);
};

const crawl = async(
  url: string,
  visited: Set<string>,
  fetchFunc: (url: string) => Promise<JSDOM>
): Promise<[JSDOM | null, Set<string>]> => {
  if (shouldCrawl(url, visited)) {
    visited.add(url);
    try {
      const dom = await fetchFunc(url);
      return [dom, visited];
    } catch (error) {
      console.error(
        `Failed to fetch ${url}:`,
        error instanceof Error ? error.message : error
      );
      return [null, visited];
    }
  }
  return [null, visited];
};

const extractData = (dom: JSDOM): FineTuneData => {
  // Extract and clean the prompt. Assuming the title can act as a prompt or question.
  const prompt = (dom.window.document.title || "No Title")
    .replace(/\s*\|.*/, '')
    .replace(/[^a-zA-Z0-9\s.,!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\?$/, '') + "?";

  const cleanText = (text: string) => {
    // Keep alphanumeric, basic punctuation, and characters common in code
    return text
      .replace(/[^a-zA-Z0-9\s.,!?()\[\]{}_+\-=\/*\\:;'"`~|#@$&]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const paragraphs = Array.from(dom.window.document.querySelectorAll("p, code, pre"))
    .map(element => {
      let text = element.textContent || '';
      if (element.tagName === 'CODE' || element.tagName === 'PRE') {
        // Minimal cleaning for code to preserve syntax
        return text.replace(/\s+/g, ' ').trim();
      } else {
        return cleanText(text);
      }
    })
    .filter(text => text.length > 0);

  // Join paragraphs into a completion but don't escape here
  let completion = paragraphs.join('\n');

  // Truncate if needed
  const maxDesiredLength = 58000;
  if (completion.length > maxDesiredLength) {
    console.warn(`Warning: Completion truncated from ${completion.length} to ${maxDesiredLength} characters.`);
    completion = completion.substring(0, maxDesiredLength);
  }

  return { prompt, completion };
};



const saveData = async (data: FineTuneData[]): Promise<void> => {
  await fs.writeFile(
    `${directory}${filename}`,
    JSON.stringify(data, null, 2),
    "utf-8"
  );
};

const findUrls = (dom: JSDOM, baseUrl: string): string[] => {
  const base = new URL(baseUrl);
  const links = Array.from(dom.window.document.querySelectorAll("a[href]"));
  return links.map((link) => {
      const href = link.getAttribute("href");
      if (href) {
        try {
          const url = new URL(href, baseUrl);
          return url.hostname === base.hostname ? url.href : null;
        } catch {
          return null;
        }
      }
      return null;
    }).filter((url) => url !== null) as string[];
};

const processUrl = async(
  url: string,
  fetchFunc: (url: string) => Promise<JSDOM>,
  saveFunc: (data: FineTuneData) => void,
  visited: Set<string>,
  baseUrl: string
): Promise<Set<string>> => {
  const [dom, updatedVisited] = await crawl(url, visited, fetchFunc);
  if (dom) {
    const data = extractData(dom);
    saveFunc(data);
    const urlsToCrawl = findUrls(dom, baseUrl);
    urlsToCrawl.forEach((newUrl) => {
      if (newUrl && !updatedVisited.has(newUrl)) {
        urlsToVisit.push(newUrl);
      }
    });
  }
  return updatedVisited;
};

let urlsToVisit: string[] = [];
let allData: FineTuneData[] = [];
let seenPrompts = new Set<string>(); // To keep track of promts we've seen

const [startUrl, visited] = initializeCrawl(baseUrl);
urlsToVisit.push(startUrl);

const fetchFunc = async (url: string): Promise<JSDOM> => {
  const response = await axios.get(url);
  return new JSDOM(response.data);
};

const saveFunc = (data: FineTuneData) => {
  if (!seenPrompts.has(data.prompt)) {
    allData.push(data);
    seenPrompts.add(data.prompt); // Mark this prompt as seen
  } else {
    console.log(`Skipped duplicate prompt: ${data.prompt}`);
  }
};

(async () => {
  while (urlsToVisit.length > 0) {
    const currentUrl = urlsToVisit.shift()!;
    await processUrl(currentUrl, fetchFunc, saveFunc, visited, baseUrl);
    console.log(
      `Visited: ${visited.size}, Queued: ${urlsToVisit.length} Titles: ${seenPrompts.size}`
    );
  };

  await saveData(allData);
  console.log("Crawling completed and unique data saved.");
})().catch(console.error);
