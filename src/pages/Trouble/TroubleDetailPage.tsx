import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Terminal,
  Radio,
  MessageSquare,
  Copy,
  Check,
  Calendar,
  User,
  Database,
  Share2,
  Sparkles,
} from "lucide-react";
import DiscussionThread from "../../components/DiscussionThread/DiscussionThread";
import CrossQuestionsSection from "../Issue/CrossQuestionsSection";
import { getUser } from "../../utils/localStorge";

export const TroubleDetailPage: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getUser();

  // Robust ID extraction from params or direct URL pathname /trouble/:id
  const id =
    paramId ||
    location.pathname.match(/^\/trouble\/([a-zA-Z0-9_-]+)/)?.[1] ||
    "";

  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchIssue = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let res;
      try {
        res = await axios.get(
          `${import.meta.env.VITE_APP_PROXY}/api/issues/${id}`
        );
      } catch {
        res = await axios.get(
          `${import.meta.env.VITE_APP_PROXY}/api/issues/view/${id}`
        );
      }

      if (res?.data?.issue) {
        setIssue(res.data.issue);
      } else if (res?.data?._id) {
        setIssue(res.data);
      } else {
        setIssue(null);
      }
    } catch (err) {
      console.error("Failed to load trouble thread:", err);
      setIssue(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id, location.pathname]);

  const handleCopyCode = () => {
    if (issue?.codeSnippet) {
      navigator.clipboard.writeText(issue.codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="trouble-detail-loading">
        <div className="trouble-detail-loading__spinner" />
        <p>Loading trouble thread & vector memory...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="trouble-detail-error">
        <h3>Trouble Thread Not Found</h3>
        <p>The trouble thread you are looking for does not exist or has been archived.</p>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={14} />
          <span>Back to Feed</span>
        </button>
      </div>
    );
  }

  const isSolved = issue.status === "SOLVED" || !!issue.acceptedOpinionId;
  const isCrossExamining = issue.status === "CROSS_EXAMINING";
  const tags: string[] = Array.isArray(issue.tags) ? issue.tags : [];
  const authorName = issue.creator || "Anonymous";

  return (
    <div className="trouble-detail">
      {/* Top Navigation Bar */}
      <div className="trouble-detail__nav">
        <Link to="/" className="trouble-detail__back-link">
          <ArrowLeft size={16} />
          <span>Back to Threads Feed</span>
        </Link>

        <div className="trouble-detail__nav-actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={handleShare}
            title="Share thread link"
          >
            {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copiedLink ? "Link Copied" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* Main Thread Root Post Card */}
      <article className={`thread-root-card ${isSolved ? "thread-root-card--solved" : ""}`}>
        {/* Author & Status Header */}
        <div className="thread-root-card__header">
          <div className="thread-root-card__author-group">
            <div className="thread-root-card__avatar">
              {authorName[0]?.toUpperCase() || "U"}
            </div>
            <div className="thread-root-card__meta">
              <div className="thread-root-card__author-row">
                <span className="thread-root-card__name">{authorName}</span>
                <span className="thread-root-card__handle">@{authorName.toLowerCase()}</span>
              </div>
              <span className="thread-root-card__date">
                <Calendar size={11} />
                <span>
                  {issue.createdAt
                    ? new Date(issue.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently posted"}
                </span>
              </span>
            </div>
          </div>

          <div className="thread-root-card__badges">
            {isSolved ? (
              <span className="badge badge--resolved badge--pill">
                <CheckCircle2 size={12} /> Solved
              </span>
            ) : isCrossExamining ? (
              <span className="badge badge--cross badge--pill">
                <AlertCircle size={12} /> In Discussion
              </span>
            ) : (
              <span className="badge badge--open badge--pill">
                <HelpCircle size={12} /> Open Question
              </span>
            )}

            {/* Dedicated Vector DB Namespace Badge */}
            <span
              className="badge badge--pill"
              style={{
                backgroundColor: "rgba(99, 102, 241, 0.12)",
                color: "#818cf8",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
              title={`Dedicated Pinecone vector memory partition for trouble ${issue._id}`}
            >
              <Database size={11} />
              <span>trouble-{issue._id.slice(-6)}</span>
            </span>
          </div>
        </div>

        {/* Title (rendered if distinct from body content) */}
        {issue.title &&
          !issue.content.toLowerCase().startsWith(issue.title.toLowerCase().slice(0, 30)) && (
            <h1 className="thread-root-card__title">{issue.title}</h1>
          )}

        {/* Content Body */}
        <div className="thread-root-card__body">
          <p>{issue.content}</p>
        </div>

        {/* Code Snippet Box */}
        {issue.codeSnippet && (
          <div className="thread-root-card__code-box">
            <div className="thread-root-card__code-header">
              <div className="thread-root-card__code-title">
                <Terminal size={13} />
                <span>Context Code Snippet</span>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={handleCopyCode}
              >
                {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="thread-root-card__code-content">
              <code>{issue.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="thread-root-card__tags">
            {tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        )}

        {/* Actions Bar */}
        <div className="thread-root-card__footer">
          <button
            type="button"
            className={`btn ${isStreaming ? "btn--secondary" : "btn--primary"} btn--sm`}
            onClick={() => setIsStreaming((prev) => !prev)}
          >
            {isStreaming ? (
              <Radio size={14} style={{ color: "#ef4444" }} />
            ) : (
              <Sparkles size={14} />
            )}
            <span>{isStreaming ? "Generating Thoughts..." : "💬 Invite Agent Thoughts"}</span>
          </button>
        </div>
      </article>

      {/* Cross Examination Questions Section */}
      <CrossQuestionsSection issueId={issue._id} />

      {/* Full Recursive Discussion Thread */}
      <DiscussionThread
        issueId={issue._id}
        issueTitle={issue.title}
        isStreaming={isStreaming}
        onStreamComplete={() => setIsStreaming(false)}
        onStopStream={() => setIsStreaming(false)}
      />
    </div>
  );
};

export default TroubleDetailPage;
