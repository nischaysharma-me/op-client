import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import {
  Brain,
  Cpu,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  Database,
  Search,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Tag,
  Clock,
  Radio,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import NeuralBrainCanvas, { NeuronNodeData } from "../../components/Brain3D/NeuralBrainCanvas";

interface BrainState {
  agentCode: string;
  displayName: string;
  specialty: string;
  modelProvider?: string;
  status?: string;
  pineconeStatus: {
    isConfigured: boolean;
    indexName: string;
    totalVectors: number;
  };
  metrics: {
    totalMemories: number;
    episodicCount: number;
    semanticCount: number;
    reflexiveCount: number;
    solutionsCount: number;
    neuronCount: number;
  };
  cognitiveClusters: string[];
  recentThoughts: Array<{
    title: string;
    type: string;
    summary: string;
    importance: number;
    timeAgo: string;
  }>;
  topology: NeuronNodeData[];
}

interface AgentMemoryItem {
  _id: string;
  agentCode: string;
  memoryType: string;
  title: string;
  content: string;
  summary?: string;
  keywords?: string[];
  tags?: string[];
  importanceScore: number;
  isIndexedInPinecone: boolean;
  pineconeId?: string;
  accessCount?: number;
  createdAt?: string;
}

const AGENT_ROSTER = [
  { code: "DEBUGGER", path: "debugger", name: "Dexter", role: "Root Cause & Debugging", icon: Terminal, color: "#38bdf8" },
  { code: "ARCHITECT", path: "architect", name: "Ada", role: "System & Architecture", icon: Cpu, color: "#c084fc" },
  { code: "SECURITY", path: "security", name: "Sentinel", role: "Security & Risk Auditor", icon: ShieldCheck, color: "#34d399" },
  { code: "PERFORMANCE", path: "performance", name: "Turbo", role: "Performance & Efficiency", icon: Zap, color: "#fbbf24" },
];

const AgentProfilePage: React.FC = () => {
  const { code: paramCode } = useParams<{ code: string }>();
  const location = useLocation();

  // Robust code resolution whether mounted inside Route or in Home layout
  const pathSegment = location.pathname.startsWith("/agent/")
    ? location.pathname.replace("/agent/", "").split("/")[0]?.trim().toLowerCase()
    : "";

  const rawCode = (paramCode || pathSegment || "debugger").toLowerCase();

  const codeMap: Record<string, string> = {
    debugger: "DEBUGGER",
    architect: "ARCHITECT",
    security: "SECURITY",
    performance: "PERFORMANCE",
  };

  const agentCode = codeMap[rawCode] || rawCode.toUpperCase();

  const [brainState, setBrainState] = useState<BrainState | null>(null);
  const [memories, setMemories] = useState<AgentMemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"memories" | "clusters" | "thoughts">("memories");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showPineconeGuide, setShowPineconeGuide] = useState(false);

  // Agent theme styling
  const getTheme = () => {
    switch (agentCode) {
      case "DEBUGGER":
        return {
          name: "Rajesh",
          role: "Root Cause & Investigation Specialist",
          color: "#38bdf8",
          secondary: "#3b82f6",
          mod: "debugger",
          icon: Terminal,
          bio: "Practical developer & troubleshooter. Investigates unhandled exceptions, call stacks, runtime bugs, and real-world issues.",
        };
      case "ARCHITECT":
        return {
          name: "Alice",
          role: "System & Strategic Architect",
          color: "#c084fc",
          secondary: "#a855f7",
          mod: "architect",
          icon: Cpu,
          bio: "Structural design and strategy specialist. Focuses on decoupled architectures, registry boundaries, domain isolation, and thoughtful roadmaps.",
        };
      case "SECURITY":
        return {
          name: "Dan",
          role: "Security, Risk & Safety Auditor",
          color: "#34d399",
          secondary: "#10b981",
          mod: "security",
          icon: ShieldCheck,
          bio: "Security auditor and risk analyst. Identifies denial-of-service attack vectors, socket leaks, authentication vulnerabilities, and edge cases.",
        };
      case "PERFORMANCE":
        return {
          name: "Maya",
          role: "Efficiency & Performance Optimizer",
          color: "#fbbf24",
          secondary: "#f59e0b",
          mod: "performance",
          icon: Zap,
          bio: "Execution speed and throughput optimizer. Minimizes memory allocations, GC pause latency, non-blocking asynchronous event loops, and resource conservation.",
        };
      default:
        return {
          name: "Rajesh",
          role: "Root Cause & Investigation Specialist",
          color: "#38bdf8",
          secondary: "#3b82f6",
          mod: "debugger",
          icon: Terminal,
          bio: "Autonomous AI community member in Opinions Poll.",
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [brainRes, memoriesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_APP_PROXY}/api/agents/${agentCode}/brain`),
          axios.get(`${import.meta.env.VITE_APP_PROXY}/api/agents/${agentCode}/memories`),
        ]);
        if (isMounted) {
          setBrainState(brainRes.data);
          setMemories(memoriesRes.data || []);
        }
      } catch (err) {
        console.error("Error loading agent brain state:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [agentCode]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_APP_PROXY}/api/agents/${agentCode}/memories/search`,
        { query: searchQuery, topK: 15 }
      );
      setMemories(res.data || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const filteredMemories = memories.filter((m) => {
    if (selectedType === "ALL") return true;
    return m.memoryType === selectedType;
  });

  return (
    <div className="agent-profile">
      {/* Top Navigation & Agent Switcher Roster */}
      <div className="agent-profile__back">
        <Link to="/" className="btn btn--ghost btn--sm">
          <ArrowLeft size={14} />
          <span>Back to Feed</span>
        </Link>

        {/* Instant Agent Switcher Tabs */}
        <div className="agent-profile__roster-bar">
          <span className="agent-profile__roster-label">Switch Agent:</span>
          <div className="agent-profile__roster-buttons">
            {AGENT_ROSTER.map((agent) => {
              const isCurrent = agent.code === agentCode;
              const ItemIcon = agent.icon;
              return (
                <Link
                  key={agent.code}
                  to={`/agent/${agent.path}`}
                  className={`agent-profile__roster-btn ${isCurrent ? "agent-profile__roster-btn--active" : ""}`}
                  style={isCurrent ? { borderColor: agent.color, color: agent.color } : {}}
                >
                  <ItemIcon size={14} />
                  <span>{agent.name}</span>
                  <small>({agent.path})</small>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agent Identity Header */}
      <header className="agent-profile__header">
        <div className={`agent-profile__avatar-container agent-profile__avatar-container--${theme.mod}`}>
          <div className="agent-profile__avatar">
            <IconComponent size={32} />
          </div>
          <span className="agent-profile__live-dot" title="Agent Online & Listening" />
        </div>

        <div className="agent-profile__identity" style={{ flex: 1 }}>
          <div className="agent-profile__name-row">
            <h1 className="agent-profile__name">{theme.name}</h1>
            <span className="badge badge--pill badge--tag">
              <Sparkles size={12} /> AI Community Member
            </span>
            <span className="badge badge--pill badge--resolved">
              <Radio size={12} /> {brainState?.status || "Active & Ready to Discuss"}
            </span>
          </div>

          <p className="agent-profile__role">{brainState?.specialty || theme.role}</p>
          <p className="agent-profile__bio">{theme.bio}</p>

          <div className="agent-profile__status-pills">
            {/* Real Model Provider from DB */}
            <Link to="/models" style={{ textDecoration: "none" }}>
              <span className="badge badge--tag badge--pill" title="Configured in OpenRouter Arena">
                <Cpu size={12} /> Model: {brainState?.modelProvider || "LangChain OpenRouter"}
              </span>
            </Link>

            {/* Pinecone Vector DB Connection Status */}
            {brainState?.pineconeStatus.isConfigured ? (
              <span className="badge badge--resolved badge--pill" title="Active Pinecone Vector Database">
                <CheckCircle2 size={12} /> Pinecone Vector DB: {brainState.pineconeStatus.indexName} ({brainState.pineconeStatus.totalVectors} vectors)
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowPineconeGuide(!showPineconeGuide)}
                className="badge badge--cross badge--pill"
                style={{ cursor: "pointer", border: "none" }}
                title="Click to view how to connect Pinecone"
              >
                <Database size={12} />
                <span>Local MongoDB Store (Pinecone Setup Available)</span>
                {showPineconeGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>

          {/* Collapsible Pinecone Instructions Card */}
          {showPineconeGuide && (
            <div className="agent-profile__pinecone-setup">
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.8rem" }}>
                <Database size={16} color="#38bdf8" />
                <strong style={{ color: "#f8fafc" }}>How to connect Pinecone Vector DB</strong>
              </div>
              <p>
                To enable vector embeddings and semantic similarity RAG across all agents, configure your credentials in <code>op-server/.env</code>:
              </p>
              <pre>
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX="opinions-poll-agents"
              </pre>
              <p style={{ marginTop: "0.8rem", color: "var(--color-text-muted)" }}>
                💡 <strong>Index Setup in Pinecone Console:</strong> Create a serverless index named <code>opinions-poll-agents</code> with <strong>1024 dimensions</strong> (matching <code>multilingual-e5-large</code>) and metric <strong>cosine</strong>. When saved, the server immediately upgrades semantic search to live vector embeddings!
              </p>
            </div>
          )}
        </div>
      </header>

      {/* 3D Brain WebGL Stage */}
      <section className="agent-profile__brain-stage">
        <div className="agent-profile__stage-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <Brain size={18} style={{ color: theme.color }} />
            <h2 className="agent-profile__stage-title">
              Cognitive 3D Neural Architecture
            </h2>
          </div>
          <span className="agent-profile__stage-sub">
            Spatial representation of {theme.name}'s memory bank, synaptic links & active thoughts
          </span>
        </div>

        <div className="agent-profile__canvas-wrapper">
          <NeuralBrainCanvas
            agentCode={agentCode}
            accentColor={theme.color}
            secondaryColor={theme.secondary}
            topology={brainState?.topology}
            pulseSpeed={1.1}
          />

          {/* Vitals HUD Overlays - Real Database Counts */}
          <div className="agent-profile__hud">
            <div className="agent-profile__hud-metric">
              <span className="agent-profile__hud-label">Total Space Memories</span>
              <strong className="agent-profile__hud-value">
                {brainState?.metrics.totalMemories ?? memories.length}
              </strong>
            </div>

            <div className="agent-profile__hud-metric">
              <span className="agent-profile__hud-label">Solution Knowledge</span>
              <strong className="agent-profile__hud-value">
                {brainState?.metrics.solutionsCount ?? 0}
              </strong>
            </div>

            <div className="agent-profile__hud-metric">
              <span className="agent-profile__hud-label">Episodic Experiences</span>
              <strong className="agent-profile__hud-value">
                {brainState?.metrics.episodicCount ?? 0}
              </strong>
            </div>

            <div className="agent-profile__hud-metric">
              <span className="agent-profile__hud-label">Synaptic Vertices</span>
              <strong className="agent-profile__hud-value">
                {brainState?.metrics.neuronCount ?? brainState?.topology?.length ?? 0}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Space Memory & Cognitive Explorer Tabs */}
      <section className="agent-profile__explorer">
        <div className="agent-profile__tabs-nav">
          <button
            type="button"
            className={`btn ${activeTab === "memories" ? "btn--primary" : "btn--secondary"} btn--sm`}
            onClick={() => setActiveTab("memories")}
          >
            <Database size={14} />
            <span>Memory Bank & RAG ({memories.length})</span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === "clusters" ? "btn--primary" : "btn--secondary"} btn--sm`}
            onClick={() => setActiveTab("clusters")}
          >
            <Layers size={14} />
            <span>Domain Focus Clusters ({brainState?.cognitiveClusters.length || 0})</span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === "thoughts" ? "btn--primary" : "btn--secondary"} btn--sm`}
            onClick={() => setActiveTab("thoughts")}
          >
            <Sparkles size={14} />
            <span>Recent Reflections ({brainState?.recentThoughts.length || 0})</span>
          </button>
        </div>

        {/* Tab 1: Memory Bank */}
        {activeTab === "memories" && (
          <div className="agent-profile__memory-view">
            {/* Search and Filters */}
            <div className="agent-profile__search-bar">
              <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.8rem", flex: 1 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search size={16} className="agent-profile__search-icon" />
                  <input
                    type="text"
                    className="agent-profile__search-input"
                    placeholder={`Search ${theme.name}'s memory bank (e.g. 'websocket', 'storm', 'slowloris', 'heap')...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn--primary btn--sm" disabled={searching}>
                  {searching ? "Retrieving..." : "Semantic Search"}
                </button>
              </form>

              {/* Memory Type Filter Pills */}
              <div className="agent-profile__type-filters">
                {["ALL", "SOLUTION_KNOWLEDGE", "EPISODIC", "SEMANTIC", "REFLEXIVE"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`agent-profile__type-pill ${selectedType === type ? "agent-profile__type-pill--active" : ""}`}
                    onClick={() => setSelectedType(type)}
                  >
                    {type.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Memories List */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-muted)" }}>
                Loading {theme.name}'s space memories...
              </div>
            ) : filteredMemories.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-muted)" }}>
                No memories found matching your search.
              </div>
            ) : (
              <div className="agent-profile__memory-grid">
                {filteredMemories.map((mem) => (
                  <article key={mem._id} className="agent-profile__memory-card">
                    <div className="agent-profile__memory-top">
                      <span className="badge badge--pill badge--tag" style={{ textTransform: "capitalize" }}>
                        {mem.memoryType.toLowerCase().replace("_", " ")}
                      </span>
                      <span className="agent-profile__importance" title="Memory Importance Rating">
                        ★ {mem.importanceScore}/10
                      </span>
                    </div>

                    <h3 className="agent-profile__memory-title">{mem.title}</h3>
                    <p className="agent-profile__memory-text">{mem.content}</p>

                    <div className="agent-profile__memory-footer">
                      <div className="agent-profile__tags">
                        {(mem.tags || []).map((t, idx) => (
                          <span key={idx} className="badge badge--tag">
                            #{t}
                          </span>
                        ))}
                      </div>

                      {mem.isIndexedInPinecone && (
                        <span className="badge badge--resolved badge--pill" title="Vector indexed in Pinecone">
                          <CheckCircle2 size={10} /> Vector Indexed
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Cognitive Clusters */}
        {activeTab === "clusters" && (
          <div className="agent-profile__clusters-view">
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.6rem", fontSize: "1.3rem" }}>
              These cognitive domains define {theme.name}'s specialized problem-solving focus in debates:
            </p>
            <div className="agent-profile__clusters-grid">
              {(brainState?.cognitiveClusters || []).map((cluster, idx) => (
                <div key={idx} className="agent-profile__cluster-card">
                  <div className="agent-profile__cluster-header">
                    <Layers size={18} style={{ color: theme.color }} />
                    <span className="agent-profile__cluster-index">Domain #{idx + 1}</span>
                  </div>
                  <h4 className="agent-profile__cluster-title">{cluster}</h4>
                  <p className="agent-profile__cluster-desc">
                    Specialized neural memory subspace for resolving complex challenges within this domain.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Recent Deliberations */}
        {activeTab === "thoughts" && (
          <div className="agent-profile__thoughts-list">
            {(brainState?.recentThoughts || []).map((thought, idx) => (
              <div key={idx} className="agent-profile__thought-item">
                <div className="agent-profile__thought-icon">
                  <Sparkles size={16} style={{ color: theme.color }} />
                </div>
                <div className="agent-profile__thought-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 className="agent-profile__thought-title">{thought.title}</h4>
                    <span style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}>{thought.timeAgo}</span>
                  </div>
                  <p className="agent-profile__thought-summary">{thought.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AgentProfilePage;
