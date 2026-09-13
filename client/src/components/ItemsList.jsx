import ExpandableText from './ExpandableText.jsx';

function ItemsList({ items, loading, refreshing, error }) {
  if (loading) return <p className="hint">Loading saved items...</p>;
  if (error) {
    return (
      <p className="error" role="alert">
        Failed to load items: {error}
      </p>
    );
  }

  return (
    <>
      {refreshing && <p className="hint">Refreshing...</p>}

      {items.length === 0 ? (
        <p className="hint">No items saved yet. Add a note or a URL above to get started.</p>
      ) : (
        <ul className="items-list">
          {items.map((item) => (
            <li key={item.id} className="item">
              <div className="item-meta">
                <span className={`badge badge-${item.type}`}>{item.type}</span>
                {item.title && <strong>{item.title}</strong>}
                <span className="date">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              {item.sourceUrl && (
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                  {item.sourceUrl}
                </a>
              )}
              <ExpandableText text={item.content} limit={300} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default ItemsList;
