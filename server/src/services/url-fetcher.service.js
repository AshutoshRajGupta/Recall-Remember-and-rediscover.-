import * as cheerio from 'cheerio';
import { AppError } from '../utils/AppError.js';

const FETCH_TIMEOUT_MS = 10000;
const MIN_CONTENT_LENGTH = 20;

/**
 * Fetches a webpage and extracts its readable text + title.
 * Kept intentionally simple: strips non-content tags and takes body text.
 * Not a full "readability" algorithm - fine for a prototype over normal public pages.
 */
export async function fetchUrlContent(url) {
  let response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AIKnowledgeInbox/1.0 (+prototype)' },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    throw new AppError(502, 'Could not reach the provided URL');
  }

  if (!response.ok) {
    throw new AppError(502, `Failed to fetch URL (status ${response.status})`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    throw new AppError(400, 'URL does not point to a readable HTML webpage');
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $('script, style, noscript, iframe, svg, nav, footer, header, form').remove();

  const title = $('title').first().text().trim() || null;

  const content = $('body').text().replace(/\s+/g, ' ').trim();

  if (content.length < MIN_CONTENT_LENGTH) {
    throw new AppError(422, 'Webpage contains no useful readable text');
  }

  return { title, content };
}
