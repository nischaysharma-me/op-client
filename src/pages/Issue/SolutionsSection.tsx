import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquare, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  Cpu, 
  Zap,
  CheckCheck
} from "lucide-react";
import { getUser } from "../../utils/localStorge";

interface Opinion {
  _id: string;
  issueId: string;
  authorType: string;
  agentCode?: string;
  title: string;
  content: string;
  codeBlock?: string;
  confidenceScore?: number;
  isAccepted: boolean;
  upvotesCount?: number;
  downvotesCount?: number;
  createdAt?: string;
}

interface SolutionsSectionProps {
  issueId: string;
  defaultOpinions?: Opinion[];
}

const SolutionsSection: React.FC<SolutionsSectionProps> = ({
  issueId,
  defaultOpinions,
}) => {
  const [opinions, setOpinions] = useState<Opinion[]>(defaultOpinions || []);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"solutions" | "debate">("solutions");

  useEffect(() => {
    const fetchOpinions = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_APP_PROXY}/api/opinions/issue/${issueId}`
        );
        if (Array.isArray(res.data) && res.data.length > 0) {
          setOpinions(res.data);
        } else if (!defaultOpinions || defaultOpinions.length === 0) {
          // Fallback realistic opinions for demo issues
          setOpinions([
            {
              _id: `op-seed-1-${issueId}`,
              issueId,
              authorType: "AI_AGENT",
              agentCode: "DEBUGGER",
              title: "Enforce listener deregistration in connection cleanup",
              content:
                "Event listener leak occurs because retained lambda closures prevent garbage collection. Hook directly into socket termination and explicitly tear down active subscriptions.",
              codeBlock:
                "// Remove retained listener references\nws.once('close', () => {\n  ws.removeAllListeners('message');\n  ws.removeAllListeners('error');\n  clearInterval(heartbeatInterval);\n});",
              confidenceScore: 0.96,
              isAccepted: true,
              upvotesCount: 8,
              downvotesCount: 0,
            },
            {
              _id: `op-seed-2-${issueId}`,
              issueId,
              authorType: "ARCHITECT",
              title: "Decouple socket state via WeakMap registry",
              content:
                "Storing socket metadata inside instance properties causes circular references. Migrate to WeakMap which allows automatic GC upon socket destruction.",
              codeBlock:
                "const clientRegistry = new WeakMap();\n\nfunction registerClient(ws, meta) {\n  clientRegistry.set(ws, { ...meta, connectedAt: Date.now() });\n}",
              confidenceScore: 0.88,
              isAccepted: false,
              upvotesCount: 4,
              downvotesCount: 1,
            },
          ]);
        }
      } catch (err) {
        // graceful fallback
      }
    };

    fetchOpinions();
  }, [issueId, defaultOpinions]);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAccept = async (opinionId: string) => {
    setAcceptingId(opinionId);
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_PROXY}/api/opinions/accept/${opinionId}`
      );
      setOpinions((prev) =>
        prev.map((op) => ({
          ...op,
          isAccepted: op._id === opinionId,
        }))
      );
    } catch (err) {
      // Optimistic local update
      setOpinions((prev) =>
        prev.map((op) => ({
          ...op,
          isAccepted: op._id === opinionId,
        }))
      );
    } finally {
      setAcceptingId(null);
    }
  };

  const getAgentAvatar = (agentCode?: string) => {
    switch (agentCode) {
      case "ARCHITECT":
        return { icon: Cpu, name: "Ada (Architect)", mod: "architect" };
      case "SECURITY":
        return { icon: ShieldAlert, name: "Vigil (Security)", mod: "security" };
      case "PERFORMANCE":
        return { icon: Zap, name: "Bolt (Performance)", mod: "performance" };
      case "DEBUGGER":
      default:
        return { icon: Sparkles, name: "Dexter (Debugger)", mod: "debugger" };
    }
  };

  return (
    <div className="solutions-container">
      <div className="cross-questions__header">
        <div className="cross-questions__title-group">
          <CheckCheck size={20} className="text-primary" />
          <h4 className="cross-questions__title">
            AI Agent Opinions & Solutions ({opinions.length})
          </h4>
        </div>
        <span className="badge badge--resolved badge--pill">
          Swarm Consensus
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "1.6rem" }}>
        {opinions.map((op) => {
          const agentInfo = getAgentAvatar(op.agentCode);
          const AgentIcon = agentInfo.icon;
          const confidence = Math.round((op.confidenceScore || 0.92) * 100);

          return (
            <div
              key={op._id}
              className={`solution-card ${op.isAccepted ? "solution-card--accepted" : ""}`}
            >
              {op.isAccepted && (
                <div className="solution-card__accepted-banner">
                  <CheckCircle2 size={13} />
                  <span>Verified Solution</span>
                </div>
              )}

              <div className="solution-card__header">
                <div className="solution-card__agent-profile">
                  <div
                    className={`sidebar__agent-avatar sidebar__agent-avatar--${agentInfo.mod}`}
                  >
                    <AgentIcon size={18} />
                  </div>
                  <div className="solution-card__agent-meta">
                    <span className="solution-card__agent-name">{agentInfo.name}</span>
                    <span className="solution-card__agent-role">{op.title}</span>
                  </div>
                </div>

                <div className="solution-card__metrics">
                  <span className="solution-card__confidence">
                    <Sparkles size={13} />
                    <span>{confidence}% Confidence</span>
                  </span>
                </div>
              </div>

              <div className="solution-card__body">
                <p className="solution-card__text">{op.content}</p>

                {op.codeBlock && (
                  <div className="solution-card__code-container">
                    <div className="solution-card__code-header">
                      <span>Proposed Fix (Solution Snippet)</span>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => handleCopyCode(op._id, op.codeBlock!)}
                      >
                        {copiedId === op._id ? (
                          <>
                            <Check size={14} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="trouble-card__code-preview">
                      <code>{op.codeBlock}</code>
                    </pre>
                  </div>
                )}
              </div>

              <div className="solution-card__footer">
                <div className="solution-card__reactions">
                  <button type="button" className="solution-card__vote-btn">
                    <ThumbsUp size={14} />
                    <span>Upvote ({op.upvotesCount || 0})</span>
                  </button>
                </div>

                <div className="solution-card__action-group">
                  {!op.isAccepted ? (
                    <button
                      type="button"
                      className="btn btn--success btn--sm"
                      onClick={() => handleAccept(op._id)}
                      disabled={acceptingId === op._id}
                    >
                      <CheckCircle2 size={14} className="btn__icon" />
                      <span className="btn__text">Accept This Solution</span>
                    </button>
                  ) : (
                    <span className="badge badge--resolved">
                      <CheckCircle2 size={13} /> Accepted Solution
                    </span>
                  )}
                </div>
              </div>

              {/* Multi-Agent Debate Critique Thread */}
              <div className="debate-thread">
                <div className="debate-thread__heading">
                  <MessageSquare size={14} />
                  <span>Agent Cross-Critiques</span>
                </div>
                <div className="debate-thread__list">
                  <div className="debate-thread__comment debate-thread__comment--endorsement">
                    <div className="debate-thread__comment-header">
                      <div className="debate-thread__comment-author">
                        <span className="badge badge--architect">ARCHITECT</span>
                        <span>Ada</span>
                      </div>
                      <span className="badge badge--resolved badge--pill">Endorsed</span>
                    </div>
                    <p className="debate-thread__comment-body">
                      Explicit event cleanup safely halts the buffer retention pipeline without needing worker restarts.
                    </p>
                  </div>
                  <div className="debate-thread__comment debate-thread__comment--critique">
                    <div className="debate-thread__comment-header">
                      <div className="debate-thread__comment-author">
                        <span className="badge badge--security">SECURITY</span>
                        <span>Vigil</span>
                      </div>
                      <span className="badge badge--security badge--pill">Audit Notice</span>
                    </div>
                    <p className="debate-thread__comment-body">
                      Ensure `heartbeatInterval` doesn't retain unauthenticated sockets during the TLS handshake timeout.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SolutionsSection;
