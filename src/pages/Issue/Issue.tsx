import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import type { RootState } from "../../store/store";
import { submitOpinion } from "../../store/issues/actions";
import { getUser } from "../../utils/localStorge";
import type { IssueItem } from "../../store/issues/issueSlice";
import { 
  ThumbsUp, 
  ThumbsDown, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Terminal, 
  Radio,
  MessageSquare,
  Database,
  ArrowRight,
  Calendar,
} from "lucide-react";
import CrossQuestionsSection from "./CrossQuestionsSection";
import DiscussionThread from "../../components/DiscussionThread/DiscussionThread";

interface ExtendedIssueItem extends IssueItem {
  status?: string;
  tags?: string[];
  language?: string;
  codeSnippet?: string;
  acceptedOpinionId?: string | null;
  creator?: string;
  createdAt?: string;
}

interface IssueProps {
  hash: number;
  issue: ExtendedIssueItem;
}

const Issue: React.FC<IssueProps> = ({ hash, issue }) => {
  const navigate = useNavigate();
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"discussion" | "questions">("discussion");
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!issue) return null;

  const getUserResponse = (): string => {
    const user = getUser();
    if (!user?._id || !issue.opinions) return "";
    const userOpinion = issue.opinions.find((each) => each.userId === user._id);
    return userOpinion ? userOpinion.opinion : "";
  };

  const handleResponse = (response: string) => {
    dispatch(submitOpinion(issue._id, response));
  };

  const handleOpinionCount = (response: string): number => {
    if (issue && issue.opinions && issue.opinions.length > 0) {
      return issue.opinions.filter((each) => each.opinion === response).length;
    }
    return 0;
  };

  const userReaction = getUserResponse();
  const isSolved = issue.status === "SOLVED" || !!issue.acceptedOpinionId;
  const isCrossExamining = issue.status === "CROSS_EXAMINING" || (!isSolved && hash % 2 === 0);
  const displayTags = (issue.tags && issue.tags.length > 0) ? issue.tags : [];
  const authorName = issue.creator || "CommunityDev";

  return (
    <article className={`threads-card ${isSolved ? "threads-card--solved" : ""}`}>
      {/* Left Column: Avatar & Continuous Thread Line */}
      <div className="threads-card__avatar-col">
        <Link to={`/trouble/${issue._id}`} className="threads-card__avatar">
          {authorName[0]?.toUpperCase() || "U"}
        </Link>
        <div className="threads-card__line" />
      </div>

      {/* Main Content Column */}
      <div className="threads-card__main">
        {/* Header Row */}
        <div className="threads-card__header">
          <div className="threads-card__author-info">
            <span className="threads-card__author-name">{authorName}</span>
            <span className="threads-card__author-handle">@{authorName.toLowerCase()}</span>
            <span className="threads-card__dot">·</span>
            <span className="threads-card__date">
              {issue.createdAt
                ? new Date(issue.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "Active"}
            </span>
          </div>

          <div className="threads-card__status-group">
            {isSolved ? (
              <span className="badge badge--resolved badge--pill">
                <CheckCircle2 size={11} /> Solved
              </span>
            ) : isCrossExamining ? (
              <span className="badge badge--cross badge--pill">
                <AlertCircle size={11} /> In Discussion
              </span>
            ) : (
              <span className="badge badge--open badge--pill">
                <HelpCircle size={11} /> Open
              </span>
            )}

            {/* Dedicated Vector DB Namespace Tag */}
            <span
              className="badge badge--pill"
              style={{
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                color: "#818cf8",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                fontSize: "1.05rem",
              }}
              title={`Pinecone vector partition: trouble-${issue._id}`}
            >
              <Database size={10} />
              <span>trouble-{issue._id.slice(-5)}</span>
            </span>
          </div>
        </div>

        {/* Content (Navigates to /trouble/:id) */}
        <Link to={`/trouble/${issue._id}`} className="threads-card__title-link">
          {issue.title &&
            !issue.content.toLowerCase().startsWith(issue.title.toLowerCase().slice(0, 30)) && (
              <h3 className="threads-card__title">{issue.title}</h3>
            )}
          <p className="threads-card__content">{issue.content}</p>
        </Link>

        {/* Code Snippet Preview Pill */}
        {issue.codeSnippet && (
          <div className="threads-card__code-preview">
            <div className="threads-card__code-header">
              <Terminal size={12} />
              <span>Code Context Attached</span>
            </div>
            <pre>
              <code>{issue.codeSnippet.split("\n").slice(0, 3).join("\n")}{issue.codeSnippet.split("\n").length > 3 ? "\n..." : ""}</code>
            </pre>
          </div>
        )}

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="threads-card__tags">
            {displayTags.map((tag, idx) => (
              <span key={idx} className="tag">
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        )}

        {/* Actions / Metrics Bar */}
        <div className="threads-card__footer">
          <div className="threads-card__reactions">
            {isAuth ? (
              <>
                <button
                  type="button"
                  className={`threads-card__reaction-btn ${
                    userReaction === "like" ? "threads-card__reaction-btn--active" : ""
                  }`}
                  onClick={() => handleResponse("like")}
                >
                  <ThumbsUp size={13} />
                  <span>{handleOpinionCount("like")}</span>
                </button>
                <button
                  type="button"
                  className={`threads-card__reaction-btn ${
                    userReaction === "dislike" ? "threads-card__reaction-btn--active" : ""
                  }`}
                  onClick={() => handleResponse("dislike")}
                >
                  <ThumbsDown size={13} />
                  <span>{handleOpinionCount("dislike")}</span>
                </button>
              </>
            ) : (
              <Link to="/login" style={{ display: "flex", gap: "0.6rem" }}>
                <button type="button" className="threads-card__reaction-btn">
                  <ThumbsUp size={13} />
                  <span>{handleOpinionCount("like")}</span>
                </button>
              </Link>
            )}

            {/* Direct Link to Dedicated Trouble Thread */}
            <Link
              to={`/trouble/${issue._id}`}
              className="threads-card__thread-btn"
              title="Open dedicated thread page"
            >
              <MessageSquare size={13} />
              <span>View Thread</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            {/* Active Organisms Strip */}
            <div className="threads-card__agents-strip">
              <span className="threads-card__agent-dot threads-card__agent-dot--debugger" title="Dexter">D</span>
              <span className="threads-card__agent-dot threads-card__agent-dot--architect" title="Ada">A</span>
              <span className="threads-card__agent-dot threads-card__agent-dot--security" title="Sentinel">S</span>
              <span className="threads-card__agent-dot threads-card__agent-dot--performance" title="Turbo">T</span>
            </div>

            {/* Quick Expand Accordion */}
            <button
              type="button"
              className="threads-card__expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse preview" : "Quick inline preview"}
            >
              <span>{isExpanded ? "Less" : "Quick View"}</span>
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Quick Inline Discussion Preview */}
        {isExpanded && (
          <div className="threads-card__inline-workspace">
            <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1.2rem" }}>
              <button
                type="button"
                className={`btn btn--sm ${activeTab === "discussion" ? "btn--primary" : "btn--secondary"}`}
                onClick={() => setActiveTab("discussion")}
              >
                <span>Discussion Thread</span>
              </button>
              <button
                type="button"
                className={`btn btn--sm ${activeTab === "questions" ? "btn--primary" : "btn--secondary"}`}
                onClick={() => setActiveTab("questions")}
              >
                <span>Clarifying Questions</span>
              </button>
              <Link to={`/trouble/${issue._id}`} style={{ marginLeft: "auto" }}>
                <button type="button" className="btn btn--outline btn--sm">
                  <span>Open Dedicated Page</span>
                  <ArrowRight size={12} />
                </button>
              </Link>
            </div>

            {activeTab === "discussion" ? (
              <DiscussionThread
                issueId={issue._id}
                issueTitle={issue.title}
                isStreaming={isStreaming}
                onStreamComplete={() => {
                  setIsStreaming(false);
                  setStatusMsg("Community members posted new thoughts!");
                  setTimeout(() => setStatusMsg(null), 5000);
                }}
                onStopStream={() => setIsStreaming(false)}
              />
            ) : (
              <CrossQuestionsSection issueId={issue._id} />
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default Issue;

