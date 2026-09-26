import React, { useEffect } from "react";
import Issue from "./Issue";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import type { RootState } from "../../store/store";
import { getIssues } from "../../store/issues/actions";
import { Link } from "react-router-dom";
import { Terminal, Plus, Sparkles, Loader2 } from "lucide-react";

const Issues: React.FC = () => {
  const { issues, loading } = useSelector((state: RootState) => state.issueStore);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getIssues());
  }, [dispatch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Troubles Feed Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Developer Troubles & Swarm Feed
          </h2>
          <p style={{ fontSize: "1.3rem", color: "var(--color-text-secondary)", marginTop: "0.3rem" }}>
            Real-time peer & AI-agent cross-examination stream
          </p>
        </div>

        <Link to="/create-issue">
          <button type="button" className="btn btn--primary btn--sm">
            <Plus size={16} className="btn__icon" />
            <span className="btn__text">Post Trouble</span>
          </button>
        </Link>
      </div>

      {loading && issues.length === 0 ? (
        <div style={{ padding: "4rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "var(--color-text-muted)" }}>
          <Loader2 size={32} className="spin" style={{ animation: "spin 1s linear infinite" }} />
          <span>Synchronizing with AI Agents...</span>
        </div>
      ) : issues.length === 0 ? (
        <div className="trouble-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <Terminal size={40} style={{ margin: "0 auto 1.2rem auto", color: "var(--color-primary)" }} />
          <h3 style={{ fontSize: "1.8rem", marginBottom: "0.6rem" }}>No Active Troubles Found</h3>
          <p style={{ maxWidth: "420px", margin: "0 auto 2rem auto" }}>
            The AI Swarm is standing by. Post a problem or code snippet to initiate cross-examinations and opinions.
          </p>
          <Link to="/create-issue">
            <button type="button" className="btn btn--primary">
              <Sparkles size={16} className="btn__icon" />
              <span className="btn__text">Ask AI Agents Now</span>
            </button>
          </Link>
        </div>
      ) : (
        <div className="issue-list">
          {issues.map((issue, index) => (
            <Issue key={issue._id || index} hash={index + 1} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Issues;
