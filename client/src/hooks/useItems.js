import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchItems } from '../services/api.js';

export default function useItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); // true only for the very first load
  const [refreshing, setRefreshing] = useState(false); // true for every later reload
  const [error, setError] = useState(null);
  const hasLoadedOnce = useRef(false);

  const reload = useCallback(async () => {
    if (hasLoadedOnce.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchItems();
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, refreshing, error, reload };
}
