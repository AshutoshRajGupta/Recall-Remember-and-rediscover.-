import { useState } from 'react';
import { queryKnowledge } from '../services/api.js';
import ExpandableText from './ExpandableText.jsx';

function QueryForm() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null); // { question, answer, sources } | null
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (searching) return;

    const trimmed = question.trim();
    if (!trimmed) {
      setError('Please enter a question.');
      return;
    }

    // Only clear the previous answer once a new request is actually being made -
    // not while the user is still typing.
    setSearching(true);
    setError(null);
    setResult(null);

    try {
      const data = await queryKnowledge(trimmed);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  const hasNoRelevantKnowledge = Boolean(result) && result.sources.length === 0;

  return (
    <div className="card">
      <h2>Ask a Question</h2>
      <p className="section-hint">
        Ask something about your saved notes and URLs - answers are generated only from what you've saved.
      </p>

      <form onSubmit={handleSubmit} className="query-input-row">
        <input
          type="text"
          placeholder="What can I use for caching?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="btn" disabled={searching}>
          {searching ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {searching && <p className="hint">Searching your saved knowledge and generating an answer...</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {result && !searching && (
        <div className="query-answer">
          <h3>Question</h3>
          <p>{result.question}</p>

          <h3>Answer</h3>
          {hasNoRelevantKnowledge ? <p className="info-banner">{result.answer}</p> : <p>{result.answer}</p>}

          <h3>Sources</h3>
          {hasNoRelevantKnowledge ? (
            <p className="hint">No relevant saved knowledge was found for this question.</p>
          ) : (
            <ol className="query-results-list">
              {result.sources.map((s) => (
                <li key={s.chunkId} className="query-result">
                  <div className="result-meta">
                    <span className="badge">Similarity: {s.score.toFixed(2)}</span>
                    <span className={`badge badge-${s.type}`}>{s.type}</span>
                    {s.title && <strong>{s.title}</strong>}
                  </div>
                  <ExpandableText text={s.snippet} limit={280} className="query-snippet" />
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.url}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

export default QueryForm;
