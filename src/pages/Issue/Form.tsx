import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { addIssue } from "../../store/issues/actions";
import { X, Sparkles, Code, Bot, Plus, Trash2 } from "lucide-react";
import { TipTapEditor } from "../../components/TipTapEditor/TipTapEditor";
import { CodeEditor } from "../../components/CodeEditor/CodeEditor";

const IssueForm: React.FC = () => {
  const [isIssueCreated, setIssueCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("typescript");
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
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
    const rawContent = form.content.trim();
    if (!rawContent) {
      showNotification("Please share your thoughts, question, or context in the editor.");
      return;
    }

    setIsSubmitting(true);

    // Auto-derive title from first line of content
    const cleanFirstLine = rawContent
      .replace(/<[^>]*>/g, "")
      .replace(/[#*`_~]/g, "")
      .split("\n")[0]
      .trim();
    const autoTitle = cleanFirstLine.slice(0, 80) || "Trouble Discussion";

    const tagsArray = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const success = await dispatch(
      addIssue({
        title: autoTitle,
        content: rawContent,
        codeSnippet: showCodeSnippet && form.codeSnippet.trim() ? form.codeSnippet.trim() : undefined,
        language: showCodeSnippet && form.codeSnippet.trim() ? codeLanguage : undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      })
    );
    setIsSubmitting(false);

    if (success) {
      setIssueCreated(true);
    } else {
      showNotification("Failed to post trouble thread.");
    }
  };

  if (isIssueCreated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="ui-modal-backdrop">
      <div className="ui-modal" style={{ maxWidth: "720px" }}>
        <div className="ui-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="top-header__logo" style={{ width: "3.2rem", height: "3.2rem" }}>
              <Bot size={18} />
            </div>
            <div>
              <h3 className="ui-modal__title">New Thread / Ask AI Swarm</h3>
              <p style={{ fontSize: "1.2rem", color: "var(--color-text-muted)" }}>
                Start a discussion, debate, or post code to troubleshoot
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

            {/* Rich Text Editor - No separate title required */}
            <div className="form-group">
              <TipTapEditor
                content={form.content}
                placeholder="What's happening? Ask a question, start a debate, or explain a bug..."
                onChange={(_html, text) => {
                  setForm((prev) => ({ ...prev, content: text }));
                }}
              />
            </div>

            {/* Collapsible Monaco Code Editor */}
            {!showCodeSnippet ? (
              <div style={{ margin: "1.2rem 0" }}>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => setShowCodeSnippet(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}
                  title="Attach code snippet with syntax highlighting"
                >
                  <Plus size={14} />
                  <Code size={14} />
                  <span>Attach Code Snippet (Optional)</span>
                </button>
                <p style={{ fontSize: "1.1rem", color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
                  💡 Attach code if you need agents and users to inspect, debug, or optimize a snippet.
                </p>
              </div>
            ) : (
              <div className="form-group" style={{ marginTop: "1.2rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.4rem",
                  }}
                >
                  <label className="form-group__label" style={{ marginBottom: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <Code size={15} />
                      <span>Code Snippet Editor</span>
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

                {/* Dedicated Monaco Code Editor */}
                <CodeEditor
                  value={form.codeSnippet}
                  onChange={(val) => setForm((prev) => ({ ...prev, codeSnippet: val }))}
                  language={codeLanguage}
                  onLanguageChange={setCodeLanguage}
                  height="220px"
                />
              </div>
            )}

            <div className="form-group" style={{ marginTop: "1.4rem" }}>
              <label className="form-group__label">
                <span>Tags / Topics (Optional)</span>
                <span className="form-group__hint">Comma separated</span>
              </label>
              <input
                type="text"
                placeholder="e.g. anime, philosophy or typescript, performance"
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
              disabled={isSubmitting || !form.content.trim()}
            >
              <Sparkles size={16} className="btn__icon" />
              <span className="btn__text">
                {isSubmitting ? "Posting..." : "Post Thread"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueForm;
