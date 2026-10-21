import { useState } from "react";
import ExpandableText from "./ExpandableText.jsx";

const INITIAL_VISIBLE_ITEMS = 2;
const ITEMS_PER_LOAD = 3;

function ItemsList({ items, loading, refreshing, error }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ITEMS);

  if (loading) {
    return <p className="hint">Loading saved items...</p>;
  }

  if (error) {
    return (
      <p className="error" role="alert">
        Failed to load items: {error}
      </p>
    );
  }

  const visibleItems = items.slice(0, visibleCount);
  const hasMoreItems = visibleCount < items.length;

  function handleLoadMore() {
    setVisibleCount((current) =>
      Math.min(current + ITEMS_PER_LOAD, items.length),
    );
  }

  function handleShowLess() {
    setVisibleCount(INITIAL_VISIBLE_ITEMS);
  }

  return (
    <>
      {refreshing && <p className="hint">Refreshing...</p>}

      {items.length === 0 ? (
        <p className="hint">
          No items saved yet. Add a note or a URL above to get started.
        </p>
      ) : (
        <>
          <ul className="items-list">
            {visibleItems.map((item) => (
              <li key={item.id} className="item">
                <div className="item-meta">
                  <span className={`badge badge-${item.type}`}>
                    {item.type}
                  </span>

                  {item.title && <strong>{item.title}</strong>}

                  <span className="date">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
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

          {items.length > INITIAL_VISIBLE_ITEMS && (
            <div className="items-pagination">
              {hasMoreItems && (
                <button
                  type="button"
                  className="btn items-load-more"
                  onClick={handleLoadMore}
                >
                  Load more (
                  {Math.min(ITEMS_PER_LOAD, items.length - visibleCount)} more)
                </button>
              )}

              {!hasMoreItems && (
                <button
                  type="button"
                  className="items-show-less"
                  onClick={handleShowLess}
                >
                  Show less
                </button>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default ItemsList;
