import { useCallback, useEffect, useState } from "react";
import IngestForm from "./components/IngestForm.jsx";
import ItemsList from "./components/ItemsList.jsx";
import QueryForm from "./components/QueryForm.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import useItems from "./hooks/useItems.js";
import GeneralChat from "./components/GeneralChat.jsx";
import { fetchCurrentUser, logoutUser } from "./services/api.js";

function Dashboard({ user, onLogout }) {
  const { items, loading, refreshing, error, reload } = useItems();

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <div className="app-logo">AI</div>
          <div>
            <h1>AI Knowledge Inbox</h1>
            <p className="app-description">
              Your personal workspace for saved knowledge and AI-powered
              answers.
            </p>
          </div>
        </div>

        <div className="account-bar">
          <span className="account-email">{user.email}</span>
          <button type="button" className="logout-button" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="workspace-column">
          <div className="column-heading">
            <h2>Knowledge Library</h2>
            <p>Add notes and webpages to your knowledge base.</p>
          </div>

          <IngestForm onIngested={reload} />

          <div className="card saved-items-card">
            <div className="section-title-row">
              <h2>Saved Items</h2>
              <span className="item-count">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>

            <ItemsList
              items={items}
              loading={loading}
              refreshing={refreshing}
              error={error}
            />
          </div>
        </section>

        <section className="workspace-column assistant-column">
          <div className="column-heading">
            <h2>AI Assistant</h2>
            <p>
              Ask questions and get answers grounded in your saved notes and
              webpages.
            </p>
          </div>

          <QueryForm />
          <GeneralChat />
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authError, setAuthError] = useState("");

  const restoreSession = useCallback(async () => {
    setAuthError("");
    const data = await fetchCurrentUser();
    setUser(data.user);
  }, []);

  useEffect(() => {
    let active = true;

    fetchCurrentUser()
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      await restoreSession();
    } catch (err) {
      setUser(null);
      setAuthError(
        err.message || "Login succeeded, but the session could not be loaded.",
      );
      throw err;
    }
  }, [restoreSession]);

  const handleLogout = useCallback(async () => {
    setAuthError("");

    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      setAuthError(err.message || "Could not sign out. Please try again.");
    }
  }, []);

  if (checkingSession) {
    return (
      <main className="auth-page">
        <p className="session-loading">Loading your workspace...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <>
        {authError && (
          <p className="auth-feedback auth-error" role="alert">
            {authError}
          </p>
        )}
        <AuthScreen onLogin={handleLogin} />
      </>
    );
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
