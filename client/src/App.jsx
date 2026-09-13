import IngestForm from './components/IngestForm.jsx';
import ItemsList from './components/ItemsList.jsx';
import QueryForm from './components/QueryForm.jsx';
import useItems from './hooks/useItems.js';

function App() {
  const { items, loading, refreshing, error, reload } = useItems();

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Knowledge Inbox</h1>
        <p className="app-description">
          Save notes and web pages, then ask questions about them. Answers are generated only from what
          you've saved, with the exact sources shown for every answer.
        </p>
      </header>

      <IngestForm onIngested={reload} />

      <QueryForm />

      <div className="card">
        <h2>Saved Items</h2>
        <ItemsList items={items} loading={loading} refreshing={refreshing} error={error} />
      </div>
    </div>
  );
}

export default App;
