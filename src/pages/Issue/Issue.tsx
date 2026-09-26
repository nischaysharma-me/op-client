import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Terminal
} from "lucide-react";
import CrossQuestionsSection from "./CrossQuestionsSection";
import SolutionsSection from "./SolutionsSection";

interface ExtendedIssueItem extends IssueItem {
  status?: string;
  tags?: string[];
  language?: string;
  codeSnippet?: string;
  acceptedOpinionId?: string | null;
}

interface IssueProps {
  hash: number;
  issue: ExtendedIssueItem;
}

const Issue: React.FC<IssueProps> = ({ hash, issue }) => {
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"questions" | "solutions">("solutions");

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

  // Default tech tags if none specified
  const displayTags = (issue.tags && issue.tags.length > 0) 
    ? issue.tags 
    : ["typescript", "nodejs", "swarm-agent"];

  return (
    <article className={`trouble-card ${isSolved ? "trouble-card--highlighted" : ""}`}>
      {/* Trouble Card Header */}
      <div className="trouble-card__header">
        <div className="trouble-card__title-group">
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <span className="trouble-card__hash">#{hash}</span>
            {isSolved ? (
              <span className="badge badge--resolved badge--pill">
                <CheckCircle2 size={12} /> Solved
              </span>
            ) : isCrossExamining ? (
              <span className="badge badge--cross badge--pill">
                <AlertCircle size={12} /> Cross-Examining
              </span>
            ) : (
              <span className="badge badge--open badge--pill">
                <HelpCircle size={12} /> Open Trouble
              </span>
            )}
          </div>
          <h2 className="trouble-card__title">{issue.title}</h2>
        </div>

        <div className="trouble-card__badges">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Sparkles size={14} className="btn__icon" />
            <span className="btn__text">
              {isExpanded ? "Hide AI Swarm" : "View AI Swarm"}
            </span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Trouble Card Body */}
      <div className="trouble-card__body">
        <p className="trouble-card__content">{issue.content}</p>

        {issue.codeSnippet && (
          <div className="trouble-card__code-preview">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#64748b", marginBottom: "0.6rem", fontSize: "1.15rem" }}>
              <Terminal size={14} />
              <span>Reported Snippet</span>
            </div>
            <code>{issue.codeSnippet}</code>
          </div>
        )}

        <div className="trouble-card__tags">
          {displayTags.map((tag, idx) => (
            <span key={idx} className="badge badge--tag">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Trouble Card Footer */}
      <div className="trouble-card__footer">
        <div className="trouble-card__reactions">
          {isAuth ? (
            <>
              <button
                type="button"
                className={`trouble-card__reaction-btn ${
                  userReaction === "like" ? "trouble-card__reaction-btn--active-like" : ""
                }`}
                onClick={() => handleResponse("like")}
              >
                <ThumbsUp size={14} />
                <span>{handleOpinionCount("like")}</span>
              </button>
              <button
                type="button"
                className={`trouble-card__reaction-btn ${
                  userReaction === "dislike" ? "trouble-card__reaction-btn--active-dislike" : ""
                }`}
                onClick={() => handleResponse("dislike")}
              >
                <ThumbsDown size={14} />
                <span>{handleOpinionCount("dislike")}</span>
              </button>
            </>
          ) : (
            <Link to="/login" style={{ display: "flex", gap: "0.8rem" }}>
              <button type="button" className="trouble-card__reaction-btn">
                <ThumbsUp size={14} />
                <span>{handleOpinionCount("like")}</span>
              </button>
              <button type="button" className="trouble-card__reaction-btn">
                <ThumbsDown size={14} />
                <span>{handleOpinionCount("dislike")}</span>
              </button>
            </Link>
          )}
        </div>

        {/* Participating AI Swarm indicators */}
        <div className="trouble-card__agents-strip">
          <span>Agents in Swarm:</span>
          <div className="trouble-card__agent-avatars">
            <span className="trouble-card__agent-dot trouble-card__agent-dot--debugger" title="Debugger Agent">D</span>
            <span className="trouble-card__agent-dot trouble-card__agent-dot--architect" title="Architect Agent">A</span>
            <span className="trouble-card__agent-dot trouble-card__agent-dot--security" title="Security Agent">S</span>
            <span className="trouble-card__agent-dot trouble-card__agent-dot--performance" title="Performance Agent">P</span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{isExpanded ? "Collapse" : "Explore Solutions"}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded AI Swarm Workspace: Cross-Questions & Solutions */}
      {isExpanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.4rem", marginTop: "1.6rem", paddingTop: "1.6rem", borderTop: "1px dashed var(--color-border-subtle)" }}>
          <div style={{ display: "flex", gap: "0.8rem" }}>
            <button
              type="button"
              className={`btn btn--sm ${activeTab === "solutions" ? "btn--primary" : "btn--secondary"}`}
              onClick={() => setActiveTab("solutions")}
            >
              <span>AI Opinions & Solutions</span>
            </button>
            <button
              type="button"
              className={`btn btn--sm ${activeTab === "questions" ? "btn--primary" : "btn--secondary"}`}
              onClick={() => setActiveTab("questions")}
            >
              <span>Cross-Questions</span>
            </button>
          </div>

          {activeTab === "solutions" ? (
            <SolutionsSection issueId={issue._id} />
          ) : (
            <CrossQuestionsSection issueId={issue._id} />
          )}
        </div>
      )}
    </article>
  );
};

export default Issue;
