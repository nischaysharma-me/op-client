import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Cpu, 
  ShieldAlert, 
  Zap, 
  CheckCircle2, 
  X, 
  Square, 
  Radio, 
  MessageSquare, 
  Layers, 
  Terminal,
  HelpCircle,
  Clock
} from "lucide-react";

interface StreamEvent {
  type:
    | "init"
    | "phase_start"
    | "agent_start"
    | "token"
    | "agent_done"
    | "phase_done"
    | "complete"
    | "error";
  phase?: "CROSS_EXAMINE" | "OPINIONS" | "DEBATE";
  agentCode?: string;
  agentName?: string;
  role?: string;
  token?: string;
  text?: string;
  targetOpinionTitle?: string;
  data?: any;
}

interface CompletedItem {
  id: string;
  phase: string;
  agentCode: string;
  agentName: string;
  role: string;
  text: string;
  timestamp: string;
}

interface StreamingSparringArenaProps {
  issueId: string;
  issueTitle: string;
  onClose: () => void;
  onComplete: () => void;
}

const StreamingSparringArena: React.FC<StreamingSparringArenaProps> = ({
  issueId,
  issueTitle,
  onClose,
  onComplete,
}) => {
  const [currentPhase, setCurrentPhase] = useState<"CROSS_EXAMINE" | "OPINIONS" | "DEBATE">("CROSS_EXAMINE");
  const [domain, setDomain] = useState<string>("GENERAL");
  const [activeAgent, setActiveAgent] = useState<{
    code: string;
    name: string;
    role: string;
    targetTitle?: string;
  } | null>(null);
  const [streamingText, setStreamingText] = useState<string>("");
  const [completedItems, setCompletedItems] = useState<CompletedItem[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [summary, setSummary] = useState<{ questionsCount: number; opinionsCount: number; commentsCount: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const textEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const startStreaming = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_PROXY}/api/sparring/stream/${issueId}`,
          {
            method: "GET",
            headers: {
              Accept: "text/event-stream",
            },
            signal: controller.signal,
          }
        );

        if (!response.ok || !response.body) {
          throw new Error(`Failed to initiate stream: HTTP ${response.status}`);
        }

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
              const event: StreamEvent = JSON.parse(jsonStr);
              handleStreamEvent(event);
            } catch (err) {
              // skip non-json keepalives
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setErrorMsg(err.message || "Streaming connection interrupted.");
        }
      }
    };

    startStreaming();

    return () => {
      controller.abort();
    };
  }, [issueId]);

  const handleStreamEvent = (event: StreamEvent) => {
    switch (event.type) {
      case "init":
        if (event.data?.domain) setDomain(event.data.domain);
        break;

      case "phase_start":
        if (event.phase) setCurrentPhase(event.phase);
        break;

      case "agent_start":
        setActiveAgent({
          code: event.agentCode || "DEBUGGER",
          name: event.agentName || "Dexter",
          role: event.role || "Specialist",
          targetTitle: event.targetOpinionTitle,
        });
        setStreamingText("");
        break;

      case "token":
        if (event.token) {
          setStreamingText((prev) => prev + event.token);
        }
        break;

      case "agent_done":
        if (activeAgent) {
          let text = "";
          if (event.phase === "CROSS_EXAMINE" && event.data?.questionText) {
            text = event.data.questionText;
          } else if (event.phase === "OPINIONS") {
            text = event.data?.content || streamingText;
          } else if (event.phase === "DEBATE") {
            text = event.data?.content || streamingText;
          } else {
            text = streamingText;
          }

          setCompletedItems((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              phase: event.phase || currentPhase,
              agentCode: activeAgent.code,
              agentName: activeAgent.name,
              role: activeAgent.role,
              text,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            },
          ]);
        }
        setActiveAgent(null);
        setStreamingText("");
        break;

      case "complete":
        setIsCompleted(true);
        if (event.data) {
          setSummary(event.data);
        }
        break;

      case "error":
        setErrorMsg(event.text || "An error occurred during agent sparring.");
        break;
    }
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onClose();
  };

  const getAgentColor = (code?: string) => {
    switch (code) {
      case "DEBUGGER":
        return "debugger";
      case "ARCHITECT":
        return "architect";
      case "SECURITY":
        return "security";
      case "PERFORMANCE":
        return "performance";
      default:
        return "debugger";
    }
  };

  const getAgentIcon = (code?: string) => {
    switch (code) {
      case "DEBUGGER":
        return <Terminal size={16} />;
      case "ARCHITECT":
        return <Cpu size={16} />;
      case "SECURITY":
        return <ShieldAlert size={16} />;
      case "PERFORMANCE":
        return <Zap size={16} />;
      default:
        return <Sparkles size={16} />;
    }
  };

  return (
    <div className="streaming-arena">
      {/* Header bar */}
      <div className="streaming-arena__header">
        <div className="streaming-arena__title-group">
          <div className="streaming-arena__live-badge">
            <span className="streaming-arena__pulse-dot" />
            <span>AI SWARM LIVE STREAM</span>
          </div>
          <span className="streaming-arena__topic-title">
            Domain: <strong>{domain}</strong> • {issueTitle}
          </span>
        </div>

        <div className="streaming-arena__controls">
          {!isCompleted ? (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={handleStopStream}
              title="Stop live stream"
            >
              <Square size={12} />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                onComplete();
                onClose();
              }}
            >
              <CheckCircle2 size={13} />
              <span>Explore Results</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            title="Minimize stream"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Phase progress breadcrumbs */}
      <div className="streaming-arena__phases">
        <div
          className={`streaming-arena__phase-tab ${
            currentPhase === "CROSS_EXAMINE"
              ? "streaming-arena__phase-tab--active"
              : isCompleted || currentPhase === "OPINIONS" || currentPhase === "DEBATE"
              ? "streaming-arena__phase-tab--done"
              : ""
          }`}
        >
          <span className="streaming-arena__phase-num">1</span>
          <span>Cross-Questions</span>
        </div>

        <div
          className={`streaming-arena__phase-tab ${
            currentPhase === "OPINIONS"
              ? "streaming-arena__phase-tab--active"
              : isCompleted || currentPhase === "DEBATE"
              ? "streaming-arena__phase-tab--done"
              : ""
          }`}
        >
          <span className="streaming-arena__phase-num">2</span>
          <span>Opinions & Plans</span>
        </div>

        <div
          className={`streaming-arena__phase-tab ${
            currentPhase === "DEBATE"
              ? "streaming-arena__phase-tab--active"
              : isCompleted
              ? "streaming-arena__phase-tab--done"
              : ""
          }`}
        >
          <span className="streaming-arena__phase-num">3</span>
          <span>Multi-Agent Debate</span>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="streaming-arena__error">
          <ShieldAlert size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active agent token typewriter console */}
      {activeAgent && (
        <div className={`streaming-arena__active-card streaming-arena__active-card--${getAgentColor(activeAgent.code)}`}>
          <div className="streaming-arena__active-meta">
            <div className={`streaming-arena__agent-avatar streaming-arena__agent-avatar--${getAgentColor(activeAgent.code)}`}>
              {getAgentIcon(activeAgent.code)}
            </div>
            <div className="streaming-arena__agent-info">
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <span className="streaming-arena__agent-name">{activeAgent.name}</span>
                <span className="streaming-arena__agent-role">{activeAgent.role}</span>
              </div>
              {activeAgent.targetTitle && (
                <span className="streaming-arena__target-note">
                  Critiquing: <em>"{activeAgent.targetTitle}"</em>
                </span>
              )}
            </div>
            <div className="streaming-arena__generating-tag">
              <Radio size={12} className="streaming-arena__radio-icon" />
              <span>Streaming response...</span>
            </div>
          </div>

          <div className="streaming-arena__stream-box">
            <pre className="streaming-arena__stream-text">
              {streamingText || "Synthesizing perspective..."}
              <span className="streaming-arena__cursor">▍</span>
            </pre>
          </div>
        </div>
      )}

      {/* Completed stream messages feed */}
      {completedItems.length > 0 && (
        <div className="streaming-arena__feed">
          <span className="streaming-arena__feed-title">
            <Clock size={13} />
            <span>Completed Sparring Deliverables ({completedItems.length})</span>
          </span>

          <div className="streaming-arena__feed-list">
            {completedItems.map((item) => (
              <div key={item.id} className="streaming-arena__feed-item">
                <div className="streaming-arena__feed-header">
                  <div className={`trouble-card__agent-dot trouble-card__agent-dot--${getAgentColor(item.agentCode)}`}>
                    {item.agentName[0]}
                  </div>
                  <span className="streaming-arena__feed-agent-name">{item.agentName}</span>
                  <span className="badge badge--pill badge--tag">{item.role}</span>
                  <span className="streaming-arena__feed-time">{item.timestamp}</span>
                </div>
                <p className="streaming-arena__feed-body">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion celebratory banner */}
      {isCompleted && (
        <div className="streaming-arena__complete-banner">
          <CheckCircle2 size={18} className="streaming-arena__check-icon" />
          <div className="streaming-arena__complete-text">
            <strong>Full AI Swarm Sparring Completed!</strong>
            <span>
              {summary
                ? `Generated ${summary.questionsCount} cross-questions, ${summary.opinionsCount} opinions, and ${summary.commentsCount} agent critiques.`
                : "All agent phases completed and saved."}
            </span>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => {
              onComplete();
              onClose();
            }}
          >
            Refresh & Explore Solutions
          </button>
        </div>
      )}
    </div>
  );
};

export default StreamingSparringArena;
