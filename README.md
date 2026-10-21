# AI Knowledge Inbox 🧠

An AI-powered knowledge workspace to save notes and URLs, search your knowledge semantically, and get context-aware answers using Retrieval-Augmented Generation (RAG). Built with React, Node.js, PostgreSQL, pgvector, Groq, and Redis.

<p align="center">
  <a href="https://ai-knowledge-inbox-prototype.vercel.app">Live Demo</a> ·
  <a href="https://github.com/AshutoshRajGupta/ai-knowledge-inbox-prototype">GitHub Repository</a>
</p>

## 🚀 Live Application

- **Frontend:** https://ai-knowledge-inbox-prototype.vercel.app
- **Backend:** https://ai-knowledge-inbox-api-80zi.onrender.com

> Note: The first request after a period of inactivity may take longer, depending on hosting and database activity.

## ✨ Features

- **Authentication:** Secure password hashing and JWT-based authentication using HTTP-only cookies.
- **Personal Knowledge Base:** Save notes and URLs and retrieve your saved content.
- **URL Ingestion:** Fetch and parse webpage content for indexing.
- **AI-Powered Semantic Search:** Find relevant information based on meaning rather than exact keyword matches.
- **RAG-Based Question Answering:** Generate context-aware answers using relevant chunks retrieved from your knowledge base.
- **Source-Aware Responses:** View relevant sources associated with knowledge-based answers.
- **General AI Chat:** Ask general questions independently of your saved knowledge.
- **Vector Search:** Store and retrieve 384-dimensional embeddings using PostgreSQL and pgvector.
- **Redis Caching:** Cache eligible repeated queries with user-specific keys, TTL, and revision-based invalidation.
- **User Data Isolation:** Scope saved knowledge to the authenticated user.
- **Cloud Deployment:** Frontend hosted on Vercel, backend on Render, and PostgreSQL hosted on Neon.

## 🛠️ Tech Stack

| Category               | Technologies                                         |
| ---------------------- | ---------------------------------------------------- |
| Frontend               | React, Vite, JavaScript, CSS                         |
| Backend                | Node.js, Express.js                                  |
| Authentication         | JWT, HTTP-only cookies, bcryptjs                     |
| Database               | Neon PostgreSQL, pgvector                            |
| Embeddings             | Hugging Face Transformers, `Xenova/all-MiniLM-L6-v2` |
| LLM                    | Groq API, `openai/gpt-oss-20b`                       |
| Web Content Extraction | Cheerio                                              |
| Caching                | Redis, Node Redis client                             |
| Local Infrastructure   | Docker, Docker Compose                               |
| Deployment             | Vercel, Render, Neon, managed Redis                  |

## 🏗️ Architecture

```text
                    React + Vite
                       Vercel
                         |
                         | HTTPS API requests
                         v
                  Node.js + Express
                       Render
                         |
              +----------+----------+
              |          |          |
              v          v          v
        PostgreSQL     Redis       Groq API
        + pgvector     Cache       LLM
          (Neon)     (Managed)
```

### RAG Query Workflow

1. The user submits a question through the frontend.
2. The backend authenticates the request and checks the query cache when applicable.
3. The embedding model converts the question into a vector.
4. PostgreSQL with pgvector retrieves relevant chunks from the user's saved knowledge.
5. The backend constructs a prompt using the question and retrieved context.
6. Groq generates a context-aware response.
7. The API returns the answer and relevant source information.
8. Eligible results can be cached in Redis for subsequent requests.

### Knowledge Ingestion Workflow

1. The user submits a text note or URL.
2. For URLs, the backend fetches and parses the available webpage content.
3. The content is normalized and split into smaller chunks.
4. The embedding model generates vector representations for the chunks.
5. Items, chunks, and embeddings are persisted in PostgreSQL.
6. Cache revision logic invalidates or makes relevant cached results stale when knowledge changes.

## 📁 Project Structure

```text
ai-knowledge-inbox/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthScreen.jsx
│   │   │   ├── GeneralChat.jsx
│   │   │   └── ItemsList.jsx
│   │   ├── services/
│   │   └── ...
│   └── package.json
├── server/
│   ├── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   └── services/
│   └── package.json
├── docker-compose.yml
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL with pgvector enabled
- Groq API key
- Docker Desktop (optional, for local Redis)

### 1. Clone the Repository

```bash
git clone https://github.com/AshutoshRajGupta/ai-knowledge-inbox-prototype.git
cd ai-knowledge-inbox-prototype
```

### 2. Configure the Backend

```bash
cd server
npm install
```

Create a `.env` file using `server/.env.example` as a template. Configure the required environment variables using the names defined in the repository.

Typical settings include:

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=replace_with_a_strong_random_secret
JWT_EXPIRES_IN=1d
GROQ_API_KEY=your_groq_api_key_here
GROQ_CHAT_MODEL=openai/gpt-oss-20b
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
TOP_K=5
SIMILARITY_THRESHOLD=0.5
REDIS_URL=redis://localhost:6379
```

These values are examples, not production credentials. Refer to `server/.env.example` and the environment configuration code for the exact variables and defaults used by your version.

**Never commit real credentials or `.env` files.**

### 3. Start Local Redis

From the repository root:

```bash
docker compose up -d redis
docker compose exec redis redis-cli ping
```

Expected output:

```text
PONG
```

### 4. Apply Database Migrations

From the `server` directory, after configuring the database connection:

```bash
npm run migrate
```

Review migrations and back up important data before applying them to an existing database.

### 5. Start the Backend

From `server`:

```bash
npm start
```

### 6. Start the Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Configure the frontend API URL using the variable defined in `client/.env.example`, if required.

Open the local URL printed by Vite, usually `http://localhost:5173`.

### 7. Build for Production

From the `client` directory:

```bash
npm run build
```

The production build is generated in `client/dist`.

## ☁️ Deployment

### Frontend — Vercel

- Root directory: `client`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Configure the production API URL using the frontend's documented environment variable.

### Backend — Render

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Configure environment variables in the Render dashboard.
- Set `DATABASE_URL` to the Neon PostgreSQL connection string.
- Set a strong, unique `JWT_SECRET`.
- Set `CLIENT_ORIGIN` to the deployed frontend origin.
- Configure `REDIS_URL` with a reachable managed Redis TCP connection URL.

For TLS-enabled hosted Redis, the URL commonly begins with `rediss://`. An Upstash REST URL is not interchangeable with the TCP connection URL expected by the Node Redis client.

Do not use `localhost` for a hosted Redis service in Render.

## 🔐 Security Considerations

- Keep API keys, database credentials, JWT secrets, and tokens out of source control.
- Use HTTPS in production.
- Use a strong, unique production JWT secret.
- Configure authentication cookies and cross-origin settings correctly.
- Ensure every relevant database query enforces user ownership.
- Avoid logging tokens, credentials, or sensitive note contents.
- Review CSRF protections, rate limiting, and URL-fetching protections before treating the application as production-hardened.

## ⚡ Performance Notes

The first query may be slower than subsequent queries because of:

- Backend or database wake-up after inactivity.
- Embedding-model initialization.
- Redis cache misses.
- Network latency between hosted services.
- LLM response generation time.

Redis caching can reduce latency for eligible repeated queries. Use backend logs and stage-level timings to identify the actual bottleneck before making further optimizations.

## 🔮 Potential Future Improvements

- Add automated tests for authentication, ingestion, retrieval, and user isolation.
- Improve RAG retrieval quality and evaluation.
- Add detailed latency monitoring for database, embeddings, Redis, and LLM calls.
- Review production rate limiting, CSRF protections, and URL-fetching safeguards.

## 📄 License

No license has been specified yet. Add a `LICENSE` file if you intend to distribute the project under an open-source license.

---

**Built with React, Node.js, PostgreSQL, vector search, and Generative AI.**
