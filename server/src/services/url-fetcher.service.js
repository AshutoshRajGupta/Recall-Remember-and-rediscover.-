import * as cheerio from "cheerio";
import { AppError } from "../utils/AppError.js";

const FETCH_TIMEOUT_MS = 10000;
const MIN_CONTENT_LENGTH = 100;

const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "svg",
  "nav",
  "footer",
  "header",
  "form",
  "button",
  "input",
  "aside",
  "dialog",
  '[role="navigation"]',
  '[role="complementary"]',
  '[aria-hidden="true"]',
  ".navbox",
  ".vertical-navbox",
  ".sidebar",
  ".toc",
  "#toc",
  ".mw-editsection",
  ".reference",
  ".reflist",
  ".metadata",
  ".sistersitebox",
];

function normalizeText(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractMainContent($) {
  const candidates = [
    "article",
    "main",
    '[role="main"]',
    "#mw-content-text",
    ".mw-parser-output",
    ".post-content",
    ".article-content",
    ".entry-content",
    ".content",
    "body",
  ];

  for (const selector of candidates) {
    const element = $(selector).first();

    if (!element.length) continue;

    const text = normalizeText(
      element
        .find("h1, h2, h3, h4, p, li, blockquote, pre")
        .map((_, node) => $(node).text().trim())
        .get()
        .filter(Boolean)
        .join("\n\n"),
    );

    if (text.length >= MIN_CONTENT_LENGTH) {
      return text;
    }
  }

  return "";
}

/**
 * Fetches a public HTML webpage and extracts readable content.
 */
export async function fetchUrlContent(url) {
  let response;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "AIKnowledgeInbox/1.0 (+prototype)",
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    throw new AppError(502, "Could not reach the provided URL");
  }

  if (!response.ok) {
    throw new AppError(502, `Failed to fetch URL (status ${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    throw new AppError(400, "URL does not point to a readable HTML webpage");
  }

  let html;

  try {
    html = await response.text();
  } catch {
    throw new AppError(502, "Could not read webpage content");
  }

  const $ = cheerio.load(html);

  const title =
    normalizeText(
      $('meta[property="og:title"]').attr("content") ||
        $("h1").first().text() ||
        $("title").first().text() ||
        "",
    ) || null;

  $(REMOVE_SELECTORS.join(",")).remove();

  const content = extractMainContent($);

  if (content.length < MIN_CONTENT_LENGTH) {
    throw new AppError(422, "Webpage contains no useful readable text");
  }

  return { title, content };
}
