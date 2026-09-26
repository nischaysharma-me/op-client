import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { addIssue } from "../../store/issues/actions";
import { X, Sparkles, Code, Terminal, Bot } from "lucide-react";

const IssueForm: React.FC = () => {
  const [isIssueCreated, setIssueCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    title: "",
    content: "",
    codeSnippet: "",
    tags: "typescript, nodejs",
  });

  const [notifier, setNotifier] = useState({
    isVisible: false,
    text: "",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const showNotification = (message: string) => {
    setNotifier({ isVisible: true, text: message });
    setTimeout(() => {
      setNotifier({ isVisible: false, text: "" });
    }, 2500);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;

    setIsSubmitting(true);
    // Combine description and code snippet if provided
    const combinedContent = form.codeSnippet.trim()
      ? `${form.content.trim()}\n\n\`\`\`\n${form.codeSnippet.trim()}\n\`\`\``
      : form.content.trim();

    const success = await dispatch(addIssue(form.title, combinedContent));
    setIsSubmitting(false);

    if (success) {
      setIssueCreated(true);
    } else {
      showNotification("Failed to submit trouble to the AI Swarm.");
    }
  };

  if (isIssueCreated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="ui-modal-backdrop">
      <div className="ui-modal">
        <div className="ui-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="top-header__logo" style={{ width: "3.2rem", height: "3.2rem" }}>
              <Bot size={18} />
            </div>
            <div>
              <h3 className="ui-modal__title">Ask AI Agents</h3>
              <p style={{ fontSize: "1.2rem", color: "var(--color-text-muted)" }}>
                Debugger, Architect, Security & Performance agents will investigate
              </p>
            </div>
          </div>
          <Link to="/">
            <button type="button" className="ui-modal__close">
              <X size={18} />
            </button>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ui-modal__body">
            {notifier.isVisible && (
              <div className="notification">
                <span>{notifier.text}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-group__label">
                <span>Trouble Summary / Title</span>
                <span className="form-group__hint">Be concise and specific</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Memory leak in WebSocket server upon client disconnect"
                className="form-group__input"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-group__label">
                <span>Detailed Symptoms & Context</span>
                <span className="form-group__hint">What happened vs expected</span>
              </label>
              <textarea
                placeholder="Explain the runtime environment, unexpected errors, or steps to reproduce..."
                className="form-group__textarea"
                rows={4}
                name="content"
                value={form.content}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-group__label">
                <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Code size={15} />
                  <span>Code Snippet or Stack Trace (Optional)</span>
                </span>
                <span className="form-group__hint">Monospace code context</span>
              </label>
              <textarea
                placeholder="// Paste suspect handler, configuration, or stack trace here"
                className="form-group__textarea form-group__textarea--code"
                rows={4}
                name="codeSnippet"
                value={form.codeSnippet}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-group__label">
                <span>Tags / Tech Stack</span>
                <span className="form-group__hint">Comma separated</span>
              </label>
              <input
                type="text"
                placeholder="typescript, nestjs, websocket, mongodb"
                className="form-group__input"
                name="tags"
                value={form.tags}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="ui-modal__footer">
            <Link to="/">
              <button type="button" className="btn btn--ghost">
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting || !form.title.trim() || !form.content.trim()}
            >
              <Sparkles size={16} className="btn__icon" />
              <span className="btn__text">
                {isSubmitting ? "Dispatching..." : "Launch Swarm Cross-Exam"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueForm;
