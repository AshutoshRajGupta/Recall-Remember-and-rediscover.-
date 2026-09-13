# AI Knowledge Inbox

A minimal full-stack prototype (built for an interview assignment) that lets a single user:

1. Add short text notes.
2. Add URLs — the backend fetches and stores the page content.
3. Ask natural-language questions about everything saved so far.
4. Get a Groq-generated answer via a simple RAG (Retrieve-Augment-Generate) pipeline, along with the source snippets used.

This is a prototype: the implementation intentionally favors simplicity over completeness, scalability, or production hardening.

## MVP Features

Everything below is actually implemented and manually verified (see "How to Test"):

- **Add a note** - short text, saved instantly.
- **Add a URL** - the backend fetches the page server-side, extracts readable text, and saves it.
- **Automatic indexing** - every saved note/URL is chunked and embedded (locally, no external embeddings API) as part of the same `POST /ingest` call - no separate "process" step.
- **Browse saved items** - type badge, title (for URLs), source link, created date, and an expandable content preview (long content is truncated with a "Show more" toggle instead of dumping the whole thing).
- **Ask a question** - semantic search (cosine similarity over stored embeddings) finds the most relevant saved chunks, then Groq generates a natural-language answer grounded in only that retrieved content.
- **Sources with every answer** - each source shows its similarity score, NOTE/URL badge, title, clickable URL (opens in a new tab), and a snippet - all built by the backend from real retrieved chunks, never invented by the frontend or the LLM.
- **Hallucination guard** - if nothing relevant is found, the LLM is never called; the UI shows a clear "not enough information" message instead of a guess.
- **Persistence** - everything lives in a single SQLite file; saved items, chunks, and embeddings all survive a full backend/frontend restart without any re-processing.
- **Graceful failure states** - invalid input, an unreachable/invalid URL, the AI service being unavailable, or the backend being down entirely all surface a clear, specific message instead of a broken or blank UI.

## Architecture

```
client (React + Vite)  <-->  server (Node + Express)  <-->  Groq API (LLM)
                                       |
                                  SQLite (content + metadata)
                                       |
                              simple in-process vector search
                              (embeddings stored alongside content,
                               similarity computed in JS — no external
                               vector DB)
```

### Flow

1. **Ingest** — user submits a note or a URL via `POST /ingest`.
   - Notes are stored as-is.
   - URLs are fetched server-side, and their text content is extracted and stored.
   - Content is chunked and embedded for later retrieval (see "Chunking & Embeddings" below).
2. **Browse** — `GET /items` lists everything ingested so far.
3. **Query** — user asks a question via `POST /query`.
   - The question is embedded (same model as documents) and compared against every stored chunk embedding via cosine similarity.
   - The most relevant chunks above a similarity threshold are retrieved (see "Retrieval" below).
   - If nothing relevant was found, Groq is never called - a fixed "not enough information" answer is returned with no sources.
   - Otherwise, the retrieved chunks are formatted into a context block and sent to Groq along with the question; Groq's answer is returned together with the source chunks that were used (see "RAG Answer Generation").

## Tech Stack

- **Frontend:** React + Vite (JavaScript)
- **Backend:** Node.js + Express (REST API)
- **AI (answer generation):** Groq API (OpenAI-compatible chat completions), called via plain `fetch` - no SDK dependency
- **AI (embeddings, now):** a local embedding model run in-process via `@huggingface/transformers` — Groq has no embeddings endpoint, so this is not a Groq call (see "Chunking & Embeddings")
- **Storage:** SQLite (single file, no external DB server)
- **Vector search:** naive cosine-similarity search over embeddings stored in SQLite — no external vector database, no ANN index (see "Retrieval")

## Chunking & Embeddings

Every item's content (a note, or a fetched webpage's extracted text) is split into chunks, and each chunk gets its own embedding vector, stored in a `chunks` table alongside the `items` table.

**Chunking strategy** ([server/src/services/chunking.service.js](server/src/services/chunking.service.js)): content is split by **word count**, not model tokens — splitting on whitespace is simpler and dependency-free, and for English text word count tracks token count closely enough for a prototype. Chunks target 650 words with a 75-word overlap between consecutive chunks (both within the requested 500–800 / 50–100 ranges). Content that fits in one chunk (most notes) is kept as a single chunk. A trailing chunk smaller than 50 words is folded into the previous one instead of being stored as a tiny fragment.

> We use moderately sized overlapping chunks so that each chunk contains enough context for semantic retrieval while the overlap reduces the chance of losing information at chunk boundaries.

**Embeddings** ([server/src/services/embedding.service.js](server/src/services/embedding.service.js)): generated locally with the `Xenova/all-MiniLM-L6-v2` model via `@huggingface/transformers` (384-dimensional vectors), loaded once per server process and reused for every chunk. No external embeddings API is called.

**Storage**: each chunk row stores its embedding as a JSON-serialized array of floats in a `TEXT` column (`chunks.embedding`). This is intentionally not a real vector database — there's no ANN index, and finding similar chunks (a later step) means loading rows and computing cosine similarity in JavaScript. Fine at prototype scale (dozens–hundreds of chunks); wouldn't scale to a large corpus.

**Backfilling existing items**: items ingested before chunking existed (or where indexing failed) have no chunks. Run `npm run backfill` from `server/` to chunk + embed any item that doesn't have chunks yet — it's safe to re-run, since items that already have chunks are skipped.

## Retrieval

`POST /query` ([server/src/services/retrieval.service.js](server/src/services/retrieval.service.js)) implements semantic search over saved content — retrieval only, no LLM call yet:

1. The question is embedded with the exact same call used for document chunks (`embedding.service.js#generateEmbedding`). This is required, not optional: the model maps text to a vector space that's only internally consistent with itself, so a question embedded by a different model wouldn't be comparable to chunk embeddings, and every similarity score would be meaningless.
2. Every chunk is loaded from SQLite (`chunk.model.js#getAllChunks`) and scored against the question via cosine similarity ([server/src/utils/vector.utils.js](server/src/utils/vector.utils.js)) — the cosine of the angle between the two vectors, in `[-1, 1]`; for these normalized embeddings, higher means more semantically similar, independent of text length.
3. Chunks are sorted by score, filtered to those at or above `SIMILARITY_THRESHOLD`, and truncated to the top `TOP_K`. Both are environment variables (`server/.env.example`), not hardcoded, defaulting to `TOP_K=5` and `SIMILARITY_THRESHOLD=0.3`.
4. For each surviving chunk, its parent item (`item.model.js#getItemById`) is looked up to attach `sourceType`, `sourceUrl`, and `title` — only for the handful of chunks actually returned, not for every chunk scanned.

**On the threshold**: `0.3` is an untuned guess, not a validated cutoff — it exists so a question unrelated to anything saved (e.g. "What is the capital of France?") can return zero results instead of forcing back irrelevant chunks. Picking a real threshold needs evaluation against labeled query/relevant-chunk pairs, which this prototype doesn't have. Treat it as a knob to adjust while testing, not a correct default.

**Performance**: every query scores *every* chunk in the database (`O(n)` per query, computed in plain JavaScript) — perfectly fine for a prototype with dozens or hundreds of chunks, since there's no index-building step and results are exact (not approximate). This does not scale to a large corpus: millions of chunks would make every query slow and hold the full embedding set in memory. A real system would reach for pgvector, a dedicated vector database, or an ANN index (HNSW/IVF) at that point — intentionally out of scope here.

## RAG Answer Generation

`POST /query` is orchestrated end-to-end by [server/src/services/query.service.js](server/src/services/query.service.js), which calls retrieval, then (conditionally) the LLM:

1. **Retrieve.** Calls `retrieval.service.js` exactly as in Step 4.
2. **Short-circuit on empty retrieval.** If zero chunks pass the similarity threshold, `query.service.js` returns a fixed answer (*"I couldn't find enough information in your saved knowledge to answer this question."*) with `sources: []` and **never calls Groq**. This is the main hallucination guard: the LLM is structurally incapable of answering from its own general knowledge when we have nothing relevant to give it, because it's never invoked at all.
3. **Build context.** [server/src/services/context.service.js](server/src/services/context.service.js) formats only the retrieved chunks (never the whole database) as `[Source 1]\n<chunk text>`, `[Source 2]\n<chunk text>`, etc. Any single chunk is defensively truncated at 2000 characters before being included (chunks are already ~650 words from chunking, so this is a safety cap, not the normal case).
4. **Generate.** [server/src/services/llm.service.js](server/src/services/llm.service.js) sends a system prompt + `Context: ... \n\nQuestion: ...` user message to Groq's OpenAI-compatible chat completions endpoint (`GROQ_API_KEY` / `GROQ_CHAT_MODEL` - the same env vars already reserved for this since Step 1; the key is read only on the server and is never sent to the frontend). The system prompt explicitly instructs the model to answer only from the given context, admit when the context is insufficient, and not invent facts.
5. **Attach sources.** The `sources` array in the response is built by our backend from the same retrieved-chunk records used to build the context (chunk id, item id, type, title, url, snippet, similarity score) - the LLM never sees ids/urls/scores and is never asked to produce citations, so a citation always corresponds to a real stored chunk.

**Error handling**: a missing `GROQ_API_KEY` fails fast with a clear message before any network call; a Groq request failure/timeout, a non-2xx response, or an unparseable/empty response are all caught in `llm.service.js` and turned into a generic `"AI service is temporarily unavailable."` (or similar) error via the existing `AppError` + centralized error middleware - the real cause is logged server-side only, never sent to the client.

**Prototype limitations**: no token budgeting (context size is bounded only by `TOP_K` × per-chunk truncation, not an actual token count), no reranking, no context compression, no conversation memory/chat history, no streaming. All explicitly deferred to a later step.

## Project Structure

```
prototype/
├── client/                # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Top-level views
│   │   ├── services/      # API client (fetch wrappers)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                # Node + Express backend
│   ├── src/
│   │   ├── controllers/   # Request handlers (map HTTP <-> services)
│   │   ├── routes/        # Express route definitions
│   │   ├── services/      # Business logic: ingestion, URL fetching,
│   │   │                  # chunking, embeddings, indexing, retrieval,
│   │   │                  # context building, Groq/LLM calls, query orchestration
│   │   ├── models/        # Data access (SQLite queries) - items, chunks
│   │   ├── scripts/       # One-off scripts (e.g. embed-existing-items.js)
│   │   ├── utils/         # Shared helpers (AppError, asyncHandler, vector math)
│   │   ├── middleware/    # Express middleware (error handling, etc.)
│   │   ├── config/        # Environment/config loading
│   │   └── app.js         # Express app entry point
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── README.md
└── package.json           # Convenience scripts for running client/server
```

## API

- `GET  /health` — health check
- `POST /ingest` — add a note or URL; content is stored, then chunked and embedded
- `GET  /items` — list saved items
- `POST /query` — ask a question, get back a Groq-generated answer grounded in retrieved chunks, plus the sources used (or a "not enough information" answer with no Groq call, if nothing relevant was found)

## Running (current step)

```bash
# install deps
npm --prefix server install
npm --prefix client install

# copy server/.env.example to server/.env and set a real GROQ_API_KEY
# (get one at https://console.groq.com) - POST /query needs it to
# generate answers; everything else works without it

# run backend (http://localhost:5000) - first request after a fresh
# install downloads the local embedding model (one-time, cached after)
npm run server

# run frontend (http://localhost:5173)
npm run client

# one-off: chunk + embed any existing items that don't have chunks yet
npm --prefix server run backfill
```

Note: `npm run server` uses `node --watch-path=src` (not plain `--watch`) so the dev server restarts on code changes but *not* on every SQLite write - `--watch`'s default behavior watches the whole working directory, which includes `data/knowledge.db`, and would otherwise restart (and reload the embedding model) on every single ingest.

## How to Test

A full manual pass, in order (matches what was verified during development):

1. **Add a note.** Type `Redis can be used for caching.` under Add Knowledge -> Note, click Save. Expect: a "Note saved." message, the form clears, and the note appears at the top of Saved Items.
2. **Add a URL.** Switch to the URL tab, enter `https://en.wikipedia.org/wiki/Redis`, click Save. Expect: a "Fetching & saving..." loading state (this one takes longer - real network fetch + extraction + embedding), then "URL fetched and saved.", and the item appears with its page title, the clickable source URL, and a truncated content preview with "Show more".
3. **Ask a relevant question.** Ask `What can I use for caching?`. Expect: a generated answer, at least one source with a similarity score, a NOTE/URL badge, and a snippet.
4. **Ask a question spanning both sources.** Ask `What is Redis used for?`. Expect: sources drawn from both the note and the Wikipedia page can appear together, and the answer reflects the combined context.
5. **Ask an unrelated question.** Ask `What is the capital of France?`. Expect: the fixed "couldn't find enough information" message, shown as an info banner, with no sources - and check the server log to confirm no `[llm]` line appears (Groq was never called).
6. **Restart everything.** Stop both `npm run server` and `npm run client`, start them again. Expect: Saved Items still shows everything from before, and asking a previously-working question still retrieves the same chunks (no re-indexing log lines on startup).
7. **Invalid/empty note.** Try to save a note with only whitespace. Expect: an inline "Please write something before saving." message, no request sent.
8. **Invalid URL.** Try to save `not-a-url`. Expect: a clear "Invalid URL" error from the backend.
9. **Backend unavailable.** Stop the backend, leave the frontend running, reload the page. Expect: Saved Items shows "Failed to load items: Could not reach the server...", and asking a question shows the same clear message - not a blank page or an uncaught error.

## Status

Implemented so far:
- Project scaffolding (Step 1)
- Note/URL ingestion, SQLite storage, `GET /items` (Step 2)
- Chunking + local embeddings for all ingested content, stored in a `chunks` table, plus a backfill script for pre-existing items (Step 3)
- Semantic retrieval: ranks all stored chunks by cosine similarity against the question (Step 4)
- RAG answer generation: retrieved chunks become context for a Groq call that produces a grounded answer + sources, with the "no relevant content -> no LLM call" hallucination guard (Step 5)
- Full UI/UX pass: clear sectioned layout, loading/success/error states for both ingestion and querying, expandable content previews, a distinct "no relevant knowledge" info state, and graceful handling of an unreachable backend (Step 6)

Not yet implemented: streaming, chat history/conversation memory, authentication.
