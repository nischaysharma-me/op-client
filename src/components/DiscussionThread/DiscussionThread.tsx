import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  CheckCircle2, 
  Copy, 
  Check, 
  CornerDownRight, 
  Radio, 
  Sparkles,
  StopCircle
} from "lucide-react";
import { getUser } from "../../utils/localStorge";

interface Author {
  _id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isAi?: boolean;
}

interface ReplyComment {
  _id: string;
  authorId?: Author | string;
  authorType: string;
  agentCode?: string;
  content: string;
  createdAt?: string;
}

interface OpinionComment {
  _id: string;
  issueId: string;
  authorId?: Author | string;
  authorType: string;
  agentCode?: string;
  title: string;
  content: string;
  codeBlock?: string;
  isAccepted: boolean;
  upvotesCount?: number;
  createdAt?: string;
  replies?: ReplyComment[];
}

interface DiscussionThreadProps {
  issueId: string;
  issueTitle: string;
  isStreaming: boolean;
  onStreamComplete?: () => void;
  onStopStream?: () => void;
}

const DiscussionThread: React.FC<DiscussionThreadProps> = ({
  issueId,
  issueTitle,
  isStreaming,
  onStreamComplete,
  onStopStream,
}) => {
  const currentUser = getUser();
  const [comments, setComments] = useState<OpinionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [activeTypingAgent, setActiveTypingAgent] = useState<{
    name: string;
    role: string;
    text: string;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch comments and their nested replies
  const fetchThread = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_PROXY}/api/opinions/issue/${issueId}`
      );
      if (Array.isArray(res.data)) {
        const fetchedOpinions: OpinionComment[] = res.data;

        // Fetch replies for each opinion in parallel
        const withReplies = await Promise.all(
          fetchedOpinions.map(async (op) => {
            try {
              const repRes = await axios.get(
                `${import.meta.env.VITE_APP_PROXY}/api/comments/target/${op._id}`
              );
              return {
                ...op,
                replies: Array.isArray(repRes.data) ? repRes.data : [],
              };
            } catch {
              return { ...op, replies: [] };
            }
          })
        );

        setComments(withReplies);
      }
    } catch {
      // Fallback defaults for empty issue demo
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [issueId]);

  // Handle Live Streaming of Community Comments
  useEffect(() => {
    if (!isStreaming) {
      setActiveTypingAgent(null);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const startStream = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_PROXY}/api/sparring/stream/${issueId}`,
          {
            method: "GET",
            headers: { Accept: "text/event-stream" },
            signal: controller.signal,
          }
        );

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.replace(/^data:\s*/, "");
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "agent_start") {
                setActiveTypingAgent({
                  name: event.agentName || "Community Member",
                  role: event.role || "Contributor",
                  text: "",
                });
              } else if (event.type === "token") {
                setActiveTypingAgent((prev) =>
                  prev ? { ...prev, text: prev.text + event.token } : null
                );
              } else if (event.type === "agent_done") {
                setActiveTypingAgent(null);
                // Refresh thread to include the freshly saved opinion or reply
                fetchThread();
              } else if (event.type === "complete") {
                setActiveTypingAgent(null);
                fetchThread();
                if (onStreamComplete) onStreamComplete();
              }
            } catch {
              // ignore non-json keepalives
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setActiveTypingAgent(null);
        }
      }
    };

    startStream();

    return () => {
      controller.abort();
    };
  }, [isStreaming, issueId]);

  // Submit new top-level comment (human user)
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser?._id) return;

    setIsSubmitting(true);
    try {
      const payload = {
        issueId,
        authorId: currentUser._id,
        authorType: "HUMAN",
        title: "Community Thought",
        content: newCommentText.trim(),
        confidenceScore: 1.0,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_APP_PROXY}/api/opinions/add`,
        payload
      );

      setComments((prev) => [
        {
          ...res.data,
          authorId: {
            _id: currentUser._id,
            username: currentUser.username,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            avatarUrl: currentUser.avatarUrl,
            isAi: false,
          },
          replies: [],
        },
        ...prev,
      ]);
      setNewCommentText("");
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit nested reply (human user)
  const handleSendReply = async (opinionId: string) => {
    if (!replyText.trim() || !currentUser?._id) return;

    try {
      const payload = {
        targetType: "OPINION",
        targetId: opinionId,
        authorId: currentUser._id,
        authorType: "HUMAN",
        content: replyText.trim(),
      };

      const res = await axios.post(
        `${import.meta.env.VITE_APP_PROXY}/api/comments/add`,
        payload
      );

      setComments((prev) =>
        prev.map((op) => {
          if (op._id === opinionId) {
            return {
              ...op,
              replies: [
                ...(op.replies || []),
                {
                  ...res.data,
                  authorId: {
                    _id: currentUser._id,
                    username: currentUser.username,
                    firstName: currentUser.firstName,
                    lastName: currentUser.lastName,
                    avatarUrl: currentUser.avatarUrl,
                  },
                },
              ],
            };
          }
          return op;
        })
      );

      setReplyText("");
      setReplyOpenId(null);
    } catch {
      // ignore
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleAcceptAnswer = async (opinionId: string) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_PROXY}/api/opinions/accept/${opinionId}`
      );
      setComments((prev) =>
        prev.map((op) => ({
          ...op,
          isAccepted: op._id === opinionId,
        }))
      );
    } catch {
      // Optimistic update
      setComments((prev) =>
        prev.map((op) => ({
          ...op,
          isAccepted: op._id === opinionId,
        }))
      );
    }
  };

  const getAuthorDisplay = (item: {
    authorId?: Author | string;
    agentCode?: string;
    authorType?: string;
  }) => {
    if (item.authorId && typeof item.authorId === "object") {
      const u = item.authorId;
      const name =
        u.firstName || u.username || (item.agentCode ? item.agentCode : "Community Member");
      return {
        name,
        avatarLetter: name[0]?.toUpperCase() || "U",
        badge: u.isAi ? "Community Contributor" : "Member",
        modifier: item.agentCode ? item.agentCode.toLowerCase() : "human",
      };
    }

    if (item.agentCode) {
      const agentNames: Record<string, string> = {
        DEBUGGER: "Dexter",
        ARCHITECT: "Ada",
        SECURITY: "Sentinel",
        PERFORMANCE: "Turbo",
      };
      const name = agentNames[item.agentCode] || item.agentCode;
      return {
        name,
        avatarLetter: name[0],
        badge: "Core Contributor",
        modifier: item.agentCode.toLowerCase(),
      };
    }

    return {
      name: "Community Member",
      avatarLetter: "C",
      badge: "Member",
      modifier: "human",
    };
  };

  return (
    <div className="discussion-thread">
      {/* Header */}
      <div className="discussion-thread__header">
        <div className="discussion-thread__title-group">
          <MessageSquare size={18} className="text-primary" />
          <h3 className="discussion-thread__title">Discussion Thread</h3>
          <span className="discussion-thread__count">
            ({comments.length} {comments.length === 1 ? "comment" : "comments"})
          </span>
        </div>

        {isStreaming && onStopStream && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onStopStream}
          >
            <StopCircle size={14} />
            <span>Stop Generating</span>
          </button>
        )}
      </div>

      {/* Real-time typing notification banner */}
      {activeTypingAgent && (
        <div className="discussion-thread__live-bar">
          <div className="discussion-thread__live-info">
            <span className="discussion-thread__live-pulse" />
            <span>
              <strong>{activeTypingAgent.name}</strong> ({activeTypingAgent.role}) is typing a response...
            </span>
          </div>
          <Radio size={14} style={{ color: "#6366f1" }} />
        </div>
      )}

      {/* Streaming comment preview */}
      {activeTypingAgent && activeTypingAgent.text && (
        <div className="discussion-thread__stream-preview">
          {activeTypingAgent.text}
          <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}> ▍</span>
        </div>
      )}

      {/* Top-Level User Comment Composer */}
      {currentUser?._id ? (
        <form className="discussion-thread__composer" onSubmit={handleSubmitComment}>
          <textarea
            className="discussion-thread__composer-input"
            placeholder="Share your perspective, code fix, or follow-up question..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
          />
          <div className="discussion-thread__composer-footer">
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={isSubmitting || !newCommentText.trim()}
            >
              <Send size={13} />
              <span>Post Comment</span>
            </button>
          </div>
        </form>
      ) : (
        <div
          style={{
            padding: "1.2rem 1.6rem",
            backgroundColor: "var(--color-bg-elevated)",
            borderRadius: "var(--radius-md)",
            fontSize: "1.3rem",
            color: "var(--color-text-secondary)",
          }}
        >
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Sign in
          </Link>{" "}
          to join the community discussion.
        </div>
      )}

      {/* List of comments in this thread */}
      <div className="discussion-thread__list">
        {comments.map((op) => {
          const author = getAuthorDisplay(op);
          const isCode =
            op.codeBlock &&
            (op.codeBlock.includes("function") ||
              op.codeBlock.includes("const ") ||
              op.codeBlock.includes("import ") ||
              op.codeBlock.includes("=>") ||
              op.codeBlock.includes("{") ||
              op.codeBlock.includes(";"));

          return (
            <div
              key={op._id}
              className={`discussion-card ${op.isAccepted ? "discussion-card--accepted" : ""}`}
            >
              {op.isAccepted && (
                <div className="discussion-card__accepted-badge">
                  <CheckCircle2 size={13} />
                  <span>Accepted Best Answer</span>
                </div>
              )}

              {/* Author & Header */}
              <div className="discussion-card__header">
                <div
                  className={`discussion-card__avatar discussion-card__avatar--${author.modifier}`}
                >
                  {author.avatarLetter}
                </div>
                <div className="discussion-card__author-info">
                  <div className="discussion-card__author-row">
                    <span className="discussion-card__author-name">{author.name}</span>
                    <span className="discussion-card__badge">{author.badge}</span>
                  </div>
                  {op.title && op.title !== "Community Thought" && (
                    <span style={{ fontSize: "1.2rem", color: "var(--color-primary)", fontWeight: 500 }}>
                      {op.title}
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="discussion-card__body">
                <p>{op.content}</p>

                {op.codeBlock && (
                  <div className="discussion-card__code-container">
                    <div className="discussion-card__code-header">
                      <span>{isCode ? "Suggested Code Snippet" : "Key Action Points"}</span>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => handleCopyCode(op._id, op.codeBlock!)}
                      >
                        {copiedCodeId === op._id ? (
                          <>
                            <Check size={13} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="discussion-card__code-snippet">
                      <code>{op.codeBlock}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="discussion-card__footer">
                <div className="discussion-card__actions">
                  <button
                    type="button"
                    className="discussion-card__action-btn"
                    onClick={() => {
                      setComments((prev) =>
                        prev.map((c) =>
                          c._id === op._id
                            ? { ...c, upvotesCount: (c.upvotesCount || 0) + 1 }
                            : c
                        )
                      );
                    }}
                  >
                    <ThumbsUp size={13} />
                    <span>Helpful ({op.upvotesCount || 0})</span>
                  </button>

                  {currentUser?._id && (
                    <button
                      type="button"
                      className="discussion-card__action-btn"
                      onClick={() =>
                        setReplyOpenId(replyOpenId === op._id ? null : op._id)
                      }
                    >
                      <CornerDownRight size={13} />
                      <span>Reply</span>
                    </button>
                  )}
                </div>

                {!op.isAccepted && (
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => handleAcceptAnswer(op._id)}
                  >
                    <CheckCircle2 size={13} />
                    <span>Mark as Accepted Answer</span>
                  </button>
                )}
              </div>

              {/* Threaded replies */}
              {op.replies && op.replies.length > 0 && (
                <div className="discussion-card__replies">
                  {op.replies.map((reply) => {
                    const repAuthor = getAuthorDisplay(reply);
                    return (
                      <div key={reply._id} className="discussion-card__reply-card">
                        <div className="discussion-card__reply-header">
                          <div
                            className={`discussion-card__reply-avatar discussion-card__avatar--${repAuthor.modifier}`}
                          >
                            {repAuthor.avatarLetter}
                          </div>
                          <span className="discussion-card__reply-name">
                            {repAuthor.name}
                          </span>
                          <span className="discussion-card__badge" style={{ fontSize: "1rem" }}>
                            {repAuthor.badge}
                          </span>
                        </div>
                        <p className="discussion-card__reply-body">{reply.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Inline reply box */}
              {replyOpenId === op._id && currentUser?._id && (
                <div className="discussion-card__reply-input-box">
                  <input
                    type="text"
                    className="discussion-card__reply-input"
                    placeholder={`Reply to ${author.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendReply(op._id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => handleSendReply(op._id)}
                    disabled={!replyText.trim()}
                  >
                    <Send size={12} />
                    <span>Reply</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DiscussionThread;
