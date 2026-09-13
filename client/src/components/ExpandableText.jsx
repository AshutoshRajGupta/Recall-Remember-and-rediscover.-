import { useState } from 'react';

const DEFAULT_LIMIT = 300;

/** Renders text truncated to `limit` chars with a Show more/less toggle - used
 * anywhere we show stored/retrieved content that could be arbitrarily long
 * (saved item content, retrieved chunk snippets). */
function ExpandableText({ text, limit = DEFAULT_LIMIT, className = 'item-content' }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > limit;
  const shown = expanded || !isLong ? text : `${text.slice(0, limit).trimEnd()}...`;

  return (
    <>
      <p className={className}>{shown}</p>
      {isLong && (
        <button type="button" className="link-button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </>
  );
}

export default ExpandableText;
