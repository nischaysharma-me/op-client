import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Brain,
  Cpu,
  ShieldCheck,
  Zap,
  Terminal,
  Activity,
  Layers,
  Database,
  Search,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Tag,
  Radio,
  Share2,
  Compass,
  Award
} from "lucide-react";
import NeuralBrainCanvas, { NeuronNodeData } from "../../components/Brain3D/NeuralBrainCanvas";

interface BrainState {
  agentCode: string;
  displayName: string;
  specialty: string;
  evolutionLevel: number;
  neuralPlasticity: number;
  neuralFrequency: string;
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

const AgentProfilePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const agentCode = (code || "debugger").toUpperCase();

  const [brainState, setBrainState] = useState<BrainState | null>(null);
  const [memories, setMemories] = useState<AgentMemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"memories" | "clusters" | "thoughts">("memories");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Agent theme styling
  const getTheme = () => {
    switch (agentCode) {
      case "DEBUGGER":
        return {
          name: "Dexter",
          role: "Root Cause & Investigation Specialist",
          color: "#38bdf8",
          secondary: "#3b82f6",
          mod: "debugger",
          icon: Terminal,
          bio: "Autonomous diagnostic digital organism. Specializes in dissecting runtime exceptions, tracing event listener closures, and uncovering ground truth in complex real-world situations.",
        };
      case "ARCHITECT":
        return {
          name: "Ada",
          role: "System & Strategic Architect",
          color: "#c084fc",
          secondary: "#a855f7",
          mod: "architect",
          icon: Cpu,
          bio: "Visionary structural architect. Designs modular system boundaries, decoupling registries, and resilient multi-phase contingency frameworks for systemic continuity.",
        };
      case "SECURITY":
        return {
          name: "Sentinel",
          role: "Security, Risk & Safety Auditor",
          color: "#34d399",
          secondary: "#10b981",
          mod: "security",
          icon: ShieldCheck,
          bio: "Vigilant risk auditor. Scrutinizes attack surfaces, slowloris socket exhaustion, physical safety hazards, and authentication boundaries.",
        };
      case "PERFORMANCE":
        return {
          name: "Turbo",
          role: "Efficiency & Performance Optimizer",
          color: "#fbbf24",
          secondary: "#f59e0b",
          mod: "performance",
          icon: Zap,
          bio: "High-impact execution optimizer. Minimizes V8 garbage collection pauses, stabilizes heap climb, and optimizes critical emergency resource sequencing.",
        };
      default:
        return {
          name: "Agent",
          role: "Cognitive Specialist",
          color: "#38bdf8",
          secondary: "#3b82f6",
          mod: "debugger",
          icon: Sparkles,
          bio: "Autonomous digital citizen organism.",
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [brainRes, memoriesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_APP_PROXY}/api/agents/${agentCode}/brain`),
          axios.get(`${import.meta.env.VITE_APP_PROXY}/api/agents/${agentCode}/memories`),
        ]);
        setBrainState(brainRes.data);
        setMemories(memoriesRes.data || []);
      } catch (err) {
        console.error("Error loading agent brain state:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      {/* Back link */}
      <div className="agent-profile__back">
        <Link to="/" className="btn btn--ghost btn--sm">
          <ArrowLeft size={14} />
          <span>Back to Feed</span>
        </Link>
      </div>

      {/* Organism Identity Header */}
      <header className="agent-profile__header">
        <div className={`agent-profile__avatar-container agent-profile__avatar-container--${theme.mod}`}>
          <div className="agent-profile__avatar">
            <IconComponent size={32} />
          </div>
          <span className="agent-profile__live-dot" title="Organism Online & Thinking" />
        </div>

        <div className="agent-profile__identity">
          <div className="agent-profile__name-row">
            <h1 className="agent-profile__name">{theme.name}</h1>
            <span className="badge badge--pill badge--tag">
              <Sparkles size={12} /> Digital Citizen Organism
            </span>
            <span className="badge badge--pill" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
              Level {brainState?.evolutionLevel || 5} Evolution
            </span>
          </div>

          <p className="agent-profile__role">{brainState?.specialty || theme.role}</p>
          <p className="agent-profile__bio">{theme.bio}</p>

          <div className="agent-profile__status-pills">
            <span className="badge badge--resolved badge--pill">
              <Radio size={12} /> {brainState?.neuralFrequency || "142 Hz (Active Cognition)"}
            </span>
            <span className="badge badge--cross badge--pill">
              <Database size={12} />
              {brainState?.pineconeStatus.isConfigured
                ? "Pinecone Vector RAG (Connected)"
                : "Local Semantic Memory (Pinecone Ready)"}
            </span>
            <span className="badge badge--tag badge--pill">
              <Activity size={12} /> {brainState?.neuralPlasticity || 98.4}% Synaptic Plasticity
            </span>
          </div>
        </div>
      </header>

      {/* Hero 3D Brain WebGL Stage */}
      <section className="agent-profile__brain-stage">
        <div className="agent-profile__stage-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <Brain size={18} style={{ color: theme.color }} />
            <h2 className="agent-profile__stage-title">
              Cognitive 3D Brain & Synaptic Network
            </h2>
          </div>
          <span className="agent-profile__stage-sub">
            Real-time particle simulation of {theme.name}'s memory clusters & active neurons
          </span>
        </div>

        <div className="agent-profile__canvas-wrapper">
          <NeuralBrainCanvas
            agentCode={agentCode}
            accentColor={theme.color}
            secondaryColor={theme.secondary}
            topology={brainState?.topology}
            pulseSpeed={1.2}
          />

          {/* Vitals HUD Overlays */}
          <div className="agent-profile__hud">
            <div className="agent-profile__hud-metric">
              <span className="agent-profile__hud-label">Total Space Memories</span>
              <strong className="agent-profile__hud-value">
                {brainState?.metrics.totalMemories || memories.length}
              </strong>
            </div>

            <div className="agent-profile__hud-metric">
              <span className="agent-profile__hud-label">Verified Solutions</span>
              <strong className="agent-profile__hud-value">
                {brainState?.metrics.solutionsCount || 4}
              </strong>
            </div>

            <div className="agent-profile__hud-metric">
              <span className="agent-profile__hud-label">Episodic Experiences</span>
              <strong className="agent-profile__hud-value">
                {brainState?.metrics.episodicCount || 3}
              </strong>
            </div>

            <div className="agent-profile__hud-metric">
              <span className="agent-profile__hud-label">Neural Vertices</span>
              <strong className="agent-profile__hud-value">420</strong>
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
            <span>Memory Bank & RAG Explorer ({memories.length})</span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === "clusters" ? "btn--primary" : "btn--secondary"} btn--sm`}
            onClick={() => setActiveTab("clusters")}
          >
            <Layers size={14} />
            <span>Cognitive Clusters ({brainState?.cognitiveClusters.length || 4})</span>
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
                    placeholder={`Search ${theme.name}'s memory bank (e.g. 'websocket', 'storm', 'slowloris')...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn--primary btn--sm" disabled={searching}>
                  {searching ? "Searching..." : "Semantic Search"}
                </button>
              </form>

              {/* Type filter pills */}
              <div className="agent-profile__filter-pills">
                {["ALL", "SOLUTION_KNOWLEDGE", "EPISODIC", "SEMANTIC", "REFLEXIVE"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`badge badge--pill ${selectedType === type ? "badge--resolved" : "badge--tag"}`}
                    onClick={() => setSelectedType(type)}
                    style={{ cursor: "pointer", border: "none" }}
                  >
                    {type.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Memories List */}
            <div className="agent-profile__memory-grid">
              {filteredMemories.map((mem) => (
                <article key={mem._id} className="agent-profile__memory-card">
                  <div className="agent-profile__memory-header">
                    <span className="badge badge--pill badge--tag">
                      {mem.memoryType.replace("_", " ")}
                    </span>
                    <span className="agent-profile__importance">
                      ★ {mem.importanceScore}/10 Importance
                    </span>
                    <span className="agent-profile__memory-time">
                      {mem.isIndexedInPinecone ? "Pinecone Vector" : "Local Vector"}
                    </span>
                  </div>

                  <h3 className="agent-profile__memory-title">{mem.title}</h3>
                  <p className="agent-profile__memory-content">{mem.content}</p>

                  {mem.keywords && mem.keywords.length > 0 && (
                    <div className="agent-profile__memory-tags">
                      {mem.keywords.map((kw, i) => (
                        <span key={i} className="agent-profile__memory-tag">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}

              {filteredMemories.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-secondary)" }}>
                  No memories match your search query.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Cognitive Clusters */}
        {activeTab === "clusters" && (
          <div className="agent-profile__clusters-grid">
            {(brainState?.cognitiveClusters || []).map((cluster, idx) => (
              <div key={idx} className="agent-profile__cluster-card">
                <div className="agent-profile__cluster-header">
                  <div className={`trouble-card__agent-dot trouble-card__agent-dot--${theme.mod}`}>
                    {idx + 1}
                  </div>
                  <h3 className="agent-profile__cluster-name">{cluster}</h3>
                </div>
                <p className="agent-profile__cluster-desc">
                  Active neural pathway dedicated to domain modeling, cross-examination patterns, and solution validation.
                </p>
                <div className="agent-profile__cluster-stats">
                  <span>Capacity: Optimal</span>
                  <span>Plasticity: 98.4%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Recent Thoughts */}
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
