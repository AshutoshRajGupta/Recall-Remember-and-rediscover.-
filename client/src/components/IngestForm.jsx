import { useState } from 'react';
import { ingestItem } from '../services/api.js';

function IngestForm({ onIngested }) {
  const [type, setType] = useState('note');
  const [noteContent, setNoteContent] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function switchType(nextType) {
    setType(nextType);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSuccess(null);

    if (type === 'note') {
      if (!noteContent.trim()) {
        setError('Please write something before saving.');
        return;
      }
    } else if (!url.trim()) {
      setError('Please enter a URL before saving.');
      return;
    }

    setSubmitting(true);
    try {
      if (type === 'note') {
        await ingestItem({ type: 'note', content: noteContent.trim() });
        setNoteContent('');
        setSuccess('Note saved.');
      } else {
        await ingestItem({ type: 'url', url: url.trim() });
        setUrl('');
        setSuccess('URL fetched and saved.');
      }
      await onIngested();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Add Knowledge</h2>
      <p className="section-hint">
        Save a short note, or paste a URL - its page content is fetched and saved automatically.
      </p>

      <form onSubmit={handleSubmit} className="ingest-form">
        <div className="tabs">
          <button
            type="button"
            className={type === 'note' ? 'active' : ''}
            onClick={() => switchType('note')}
            disabled={submitting}
          >
            Note
          </button>
          <button
            type="button"
            className={type === 'url' ? 'active' : ''}
            onClick={() => switchType('url')}
            disabled={submitting}
          >
            URL
          </button>
        </div>

        {type === 'note' ? (
          <textarea
            rows={4}
            placeholder="Write a note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            disabled={submitting}
          />
        ) : (
          <input
            type="text"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={submitting}
          />
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {success && <p className="success">{success}</p>}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? (type === 'note' ? 'Saving...' : 'Fetching & saving...') : 'Save'}
        </button>
      </form>
    </div>
  );
}

export default IngestForm;
