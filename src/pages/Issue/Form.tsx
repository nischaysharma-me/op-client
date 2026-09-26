import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { addIssue } from "../../store/issues/actions";
import { X, Sparkles, Code, Bot, Plus, Trash2 } from "lucide-react";
import { TipTapEditor } from "../../components/TipTapEditor/TipTapEditor";

const IssueForm: React.FC = () => {
  const [isIssueCreated, setIssueCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    title: "",
    content: "",
    codeSnippet: "",
    tags: "",
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
    if (!form.title.trim() || !form.content.trim()) {
      showNotification("Please provide both a title and detailed context.");
      return;
    }

    setIsSubmitting(true);
    // Combine description and code snippet ONLY if user opted to provide one
    const combinedContent =
      showCodeSnippet && form.codeSnippet.trim()
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
              <h3 className="ui-modal__title">Post Topic / Ask AI Swarm</h3>
              <p style={{ fontSize: "1.2rem", color: "var(--color-text-muted)" }}>
                Start a general discussion, debate, or submit a technical trouble
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
                <span>Title / Summary</span>
                <span className="form-group__hint">Be concise and specific</span>
              </label>
              <input
                type="text"
                placeholder="e.g. What is the Ending of One Piece? or Memory leak in WebSocket server"
                className="form-group__input"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-group__label">
                <span>Detailed Context & Thoughts</span>
                <span className="form-group__hint">Rich editor (bold, lists, headings)</span>
              </label>
              <TipTapEditor
                content={form.content}
                placeholder="Share your thoughts, symptoms, perspective, or question..."
                onChange={(_html, text) => {
                  setForm((prev) => ({ ...prev, content: text }));
                }}
              />
            </div>

            {/* Optional Collapsible Code Snippet */}
            {!showCodeSnippet ? (
              <div style={{ margin: "1.2rem 0" }}>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => setShowCodeSnippet(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}
                  title="Attach code snippet or logs if applicable"
                >
                  <Plus size={14} />
                  <Code size={14} />
                  <span>Attach Code Snippet (Optional)</span>
                </button>
                <p style={{ fontSize: "1.1rem", color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
                  💡 Code snippets are completely optional. Non-technical questions or discussions do not need code.
                </p>
              </div>
            ) : (
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label className="form-group__label" style={{ marginBottom: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <Code size={15} />
                      <span>Code Snippet or Logs (Optional)</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setShowCodeSnippet(false);
                      setForm((prev) => ({ ...prev, codeSnippet: "" }));
                    }}
                    style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}
                    title="Remove code snippet"
                  >
                    <Trash2 size={12} style={{ marginRight: "0.4rem" }} />
                    Remove Code
                  </button>
                </div>
                <textarea
                  placeholder="// Paste suspect handler, configuration, or logs here..."
                  className="form-group__textarea form-group__textarea--code"
                  rows={4}
                  name="codeSnippet"
                  value={form.codeSnippet}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-group__label">
                <span>Tags / Topics (Optional)</span>
                <span className="form-group__hint">Comma separated</span>
              </label>
              <input
                type="text"
                placeholder="e.g. anime, one-piece, philosophy or typescript, nodejs"
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
