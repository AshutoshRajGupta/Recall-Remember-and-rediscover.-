import { useState } from "react";
import { sendChatMessage } from "../services/api.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function GeneralChat() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmed = message.trim();

    if (!trimmed || sending) return;

    setSending(true);
    setError("");
    setMessage("");

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setConversation((current) => [...current, userMessage]);

    try {
      const data = await sendChatMessage(trimmed);

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
      };

      setConversation((current) => [...current, assistantMessage]);
    } catch (err) {
      setError(err.message || "Could not get an answer. Please try again.");
      setMessage(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card general-chat-card">
      <h2>General AI Chat</h2>
      <p className="section-hint">
        Ask anything — coding doubts, technical concepts, explanations, and
        more. Answers aren't restricted to your saved knowledge.
      </p>

      <div className="general-chat-messages" aria-live="polite">
        {conversation.length === 0 && (
          <p className="hint">
            Try asking: "Explain Redis caching with a JavaScript example."
          </p>
        )}

        {conversation.map((item) => (
          <div
            key={item.id}
            className={`general-chat-message general-chat-message-${item.role}`}
          >
            <strong>{item.role === "user" ? "You" : "AI Assistant"}</strong>
            {item.role === "assistant" ? (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {item.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p>{item.content}</p>
            )}
          </div>
        ))}

        {sending && (
          <p className="hint" role="status">
            AI is thinking...
          </p>
        )}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="query-input-row">
        <input
          type="text"
          placeholder="Ask anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={4000}
          disabled={sending}
          aria-label="Message for general AI chat"
        />
        <button
          type="submit"
          className="btn"
          disabled={sending || !message.trim()}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}

export default GeneralChat;
