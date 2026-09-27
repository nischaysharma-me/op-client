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
  StopCircle,
  ChevronDown,
  ChevronUp,
  X
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

interface ThreadNode {
  _id: string;
  targetId: string;
  authorId?: Author | string;
  authorType: string;
  agentCode?: string;
  content: string;
  parentCommentId?: any;
  createdAt?: string;
  upvotesCount?: number;
  replies: ThreadNode[];
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
  repliesTree: ThreadNode[];
}

interface DiscussionThreadProps {
  issueId: string;
  issueTitle: string;
  isStreaming: boolean;
  onStreamComplete?: () => void;
  onStopStream?: () => void;
}

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

/**
 * Builds a recursive tree from a flat array of comments with parentCommentId
 */
const buildThreadTree = (flatComments: any[]): ThreadNode[] => {
  if (!Array.isArray(flatComments) || flatComments.length === 0) return [];

  const nodeMap = new Map<string, ThreadNode>();
  flatComments.forEach((c) => {
    nodeMap.set(c._id, { ...c, replies: [] });
  });

  const roots: ThreadNode[] = [];
  flatComments.forEach((c) => {
    const node = nodeMap.get(c._id)!;
    const parentId =
      typeof c.parentCommentId === "object" && c.parentCommentId?._id
        ? c.parentCommentId._id
        : typeof c.parentCommentId === "string"
        ? c.parentCommentId
        : null;

    if (parentId && nodeMap.has(parentId)) {
      nodeMap.get(parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

/**
 * Recursive Thread Comment Item
 */
interface ThreadCommentItemProps {
  node: ThreadNode;
  opinionId: string;
  depth: number;
  replyOpenId: string | null;
  setReplyOpenId: (id: string | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  onSendReply: (opinionId: string, parentCommentId: string | null) => Promise<void>;
  currentUser: any;
  onUpvote: (commentId: string) => void;
}

const ThreadCommentItem: React.FC<ThreadCommentItemProps> = ({
  node,
  opinionId,
  depth,
  replyOpenId,
  setReplyOpenId,
  replyText,
  setReplyText,
  onSendReply,
  currentUser,
  onUpvote,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const author = getAuthorDisplay(node);

  // Extract replying-to author name if available
  const replyToAuthorName = (() => {
    if (node.parentCommentId && typeof node.parentCommentId === "object") {
      const pAuthor = node.parentCommentId.authorId;
      if (pAuthor && typeof pAuthor === "object") {
        return pAuthor.firstName || pAuthor.username || null;
      }
    }
    return null;
  })();

  const isReplyingToThis = replyOpenId === node._id;

  return (
    <div className="thread-node">
      <div className="thread-node__content-card">
        {/* Header */}
        <div className="thread-node__header">
          <div className="thread-node__author-meta">
            <div className={`thread-node__avatar thread-node__avatar--${author.modifier}`}>
              {author.avatarLetter}
            </div>
            <span className="thread-node__name">{author.name}</span>
            <span className="thread-node__badge">{author.badge}</span>

            {replyToAuthorName && (
              <span className="thread-node__reply-target">
                ↳ @{replyToAuthorName}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {node.replies.length > 0 && (
              <button
                type="button"
                className="thread-node__action-btn"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand replies" : "Collapse replies"}
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown size={12} />
                    <span>+{node.replies.length} replies</span>
                  </>
                ) : (
                  <>
                    <ChevronUp size={12} />
                    <span>collapse</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <p className="thread-node__body">{node.content}</p>

        {/* Footer Actions */}
        <div className="thread-node__footer">
          <button
            type="button"
            className="thread-node__action-btn"
            onClick={() => onUpvote(node._id)}
          >
            <ThumbsUp size={12} />
            <span>Helpful ({node.upvotesCount || 0})</span>
          </button>

          {currentUser?._id && (
            <button
              type="button"
              className={`thread-node__action-btn ${isReplyingToThis ? "thread-node__action-btn--active" : ""}`}
              onClick={() => {
                if (isReplyingToThis) {
                  setReplyOpenId(null);
                  setReplyText("");
                } else {
                  setReplyOpenId(node._id);
                  setReplyText("");
                }
              }}
            >
              <CornerDownRight size={12} />
              <span>Reply</span>
            </button>
          )}
        </div>

        {/* Inline Reply Composer for this specific comment */}
        {isReplyingToThis && currentUser?._id && (
          <div className="thread-node__reply-box">
            <textarea
              className="thread-node__reply-input"
              placeholder={`Reply to ${author.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && replyText.trim()) {
                  e.preventDefault();
                  onSendReply(opinionId, node._id);
                }
              }}
            />
            <div className="thread-node__reply-actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setReplyOpenId(null);
                  setReplyText("");
                }}
              >
                <X size={12} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onSendReply(opinionId, node._id)}
                disabled={!replyText.trim()}
              >
                <Send size={12} />
                <span>Send Reply</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recursive Children Replies */}
      {!isCollapsed && node.replies.length > 0 && (
        <div className="thread-node__children">
          {node.replies.map((child) => (
            <ThreadCommentItem
              key={child._id}
              node={child}
              opinionId={opinionId}
              depth={depth + 1}
              replyOpenId={replyOpenId}
              setReplyOpenId={setReplyOpenId}
              replyText={replyText}
              setReplyText={setReplyText}
              onSendReply={onSendReply}
              currentUser={currentUser}
              onUpvote={onUpvote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main DiscussionThread Component
 */
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

  // Fetch opinions and their nested comment tree
  const fetchThread = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_PROXY}/api/opinions/issue/${issueId}`
      );
      if (Array.isArray(res.data)) {
        const fetchedOpinions: any[] = res.data;

        // Fetch comments tree for each opinion in parallel
        const withTrees = await Promise.all(
          fetchedOpinions.map(async (op) => {
            try {
              const repRes = await axios.get(
                `${import.meta.env.VITE_APP_PROXY}/api/comments/target/${op._id}`
              );
              const flatComments = Array.isArray(repRes.data) ? repRes.data : [];
              return {
                ...op,
                repliesTree: buildThreadTree(flatComments),
              };
            } catch {
              return { ...op, repliesTree: [] };
            }
          })
        );

        setComments(withTrees);
      }
    } catch {
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

  // Submit top-level comment (opinion)
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
          repliesTree: [],
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

  // Submit nested reply to ANY comment or reply in the thread tree
  const handleSendReply = async (opinionId: string, parentCommentId: string | null) => {
    if (!replyText.trim() || !currentUser?._id) return;

    try {
      const payload = {
        targetType: "OPINION",
        targetId: opinionId,
        authorId: currentUser._id,
        authorType: "HUMAN",
        parentCommentId: parentCommentId || null,
        content: replyText.trim(),
      };

      await axios.post(
        `${import.meta.env.VITE_APP_PROXY}/api/comments/add`,
        payload
      );

      setReplyText("");
      setReplyOpenId(null);
      // Refresh the discussion tree so the new nested reply appears in exact tree hierarchy
      await fetchThread();
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
      setComments((prev) =>
        prev.map((op) => ({
          ...op,
          isAccepted: op._id === opinionId,
        }))
      );
    }
  };

  return (
    <div className="discussion-thread">
      {/* Thread Header */}
      <div className="discussion-thread__header">
        <div className="discussion-thread__title-group">
          <MessageSquare size={18} className="text-primary" />
          <h3 className="discussion-thread__title">Discussion Thread</h3>
          <span className="discussion-thread__count">
            ({comments.length} {comments.length === 1 ? "perspective" : "perspectives"})
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
            placeholder="Share your perspective, code fix, or follow-up question in the thread..."
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
          to join the community discussion thread.
        </div>
      )}

      {/* List of comments and recursive thread trees */}
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

          const isReplyingToOpinion = replyOpenId === op._id;

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

              {/* Footer actions on the root opinion */}
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
                      className={`discussion-card__action-btn ${isReplyingToOpinion ? "discussion-card__action-btn--active" : ""}`}
                      onClick={() => {
                        if (isReplyingToOpinion) {
                          setReplyOpenId(null);
                          setReplyText("");
                        } else {
                          setReplyOpenId(op._id);
                          setReplyText("");
                        }
                      }}
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

              {/* Inline reply composer under root opinion */}
              {isReplyingToOpinion && currentUser?._id && (
                <div className="thread-node__reply-box" style={{ marginTop: "1rem" }}>
                  <textarea
                    className="thread-node__reply-input"
                    placeholder={`Reply to ${author.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && replyText.trim()) {
                        e.preventDefault();
                        handleSendReply(op._id, null);
                      }
                    }}
                  />
                  <div className="thread-node__reply-actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => {
                        setReplyOpenId(null);
                        setReplyText("");
                      }}
                    >
                      <X size={12} />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => handleSendReply(op._id, null)}
                      disabled={!replyText.trim()}
                    >
                      <Send size={12} />
                      <span>Send Reply</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Recursive Thread Tree of Replies */}
              {op.repliesTree && op.repliesTree.length > 0 && (
                <div className="discussion-card__replies">
                  {op.repliesTree.map((rootReply) => (
                    <ThreadCommentItem
                      key={rootReply._id}
                      node={rootReply}
                      opinionId={op._id}
                      depth={0}
                      replyOpenId={replyOpenId}
                      setReplyOpenId={setReplyOpenId}
                      replyText={replyText}
                      setReplyText={setReplyText}
                      onSendReply={handleSendReply}
                      currentUser={currentUser}
                      onUpvote={(commentId) => {
                        // local optimistic upvote
                      }}
                    />
                  ))}
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
