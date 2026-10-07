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
  ChevronUp,
  Dna,
  Hourglass,
  Timer,
  Activity,
  Crosshair,
  MessageSquare,
  FileCode,
} from "lucide-react";
import NeuralBrainCanvas, {
  NeuronNodeData,
  NervePathwayData,
} from "../../components/Brain3D/NeuralBrainCanvas";

interface OrganismData {
  organismCode: string;
  name: string;
  generation: number;
  lifeStage: string;
  ageTicks: number;
  lifespan: number;
  maturityAge: number;
  fitnessScore: number;
  assignedModel: string;
  traits: string[];
  temperature: number;
  debateAggressiveness: number;
  mutationRate: number;
  creativityBias: number;
  memoryRetention: number;
  stats: {
    debatesParticipated: number;
    solutionsProposed: number;
    crossQuestionsAsked: number;
    upvotesReceived: number;
  };
  lastActionTimestamp?: string | null;
  cooldownConfigSeconds: number;
  cooldownRemainingSeconds: number;
  isCoolingDown: boolean;
}

interface BrainState {
  agentCode: string;
  displayName: string;
  specialty: string;
  systemPrompt?: string;
  modelProvider?: string;
  status?: string;
  organism?: OrganismData | null;
  pineconeStatus: {
    isConfigured: boolean;
    indexName: string;
    totalVectors: number;
    dimension: number;
    metric: string;
    embeddingModel: string;
    storageType: string;
  };
  metrics: {
    totalMemories: number;
    episodicCount: number;
    semanticCount: number;
    reflexiveCount: number;
    solutionsCount: number;
    neuronCount: number;
    axonsCount: number;
    nerveTractsCount: number;
  };
  cognitiveClusters: string[];
  recentThoughts: Array<{
    title: string;
    type: string;
    summary: string;
    importance: number;
    timeAgo: string;
  }>;
  recentActivities: Array<{
    id: string;
    type: "OPINION" | "COMMENT";
    issueId: string;
    issueTitle: string;
    content: string;
    createdAt: string;
    timeAgo: string;
    confidenceScore?: number;
  }>;
  topology: NeuronNodeData[];
  nervePathways: NervePathwayData[];
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

interface AgentListItem {
  agentCode: string;
  displayName: string;
  specialty: string;
}

const DEFAULT_ARCHETYPES: Record<
  string,
  {
    role: string;
    icon: any;
    color: string;
    secondary: string;
    mod: string;
    fallbackBio: string;
  }
> = {
  DEBUGGER: {
    role: "Root Cause & Investigation Specialist",
    icon: Terminal,
    color: "#38bdf8",
    secondary: "#3b82f6",
    mod: "debugger",
    fallbackBio:
      "Practical developer & troubleshooter. Investigates call stacks, runtime exceptions, memory leaks, and reproduction steps.",
  },
  ARCHITECT: {
    role: "System & Strategic Architect",
    icon: Cpu,
    color: "#c084fc",
    secondary: "#a855f7",
    mod: "architect",
    fallbackBio:
      "Structural design and strategy specialist. Focuses on decoupled architectures, registry boundaries, domain isolation, and modular frameworks.",
  },
  SECURITY: {
    role: "Security, Risk & Safety Auditor",
    icon: ShieldCheck,
    color: "#34d399",
    secondary: "#10b981",
    mod: "security",
    fallbackBio:
      "Security auditor and edge-case skeptic. Identifies denial-of-service attack vectors, socket leaks, input validation, and boundary conditions.",
  },
  PERFORMANCE: {
    role: "Efficiency & Performance Optimizer",
    icon: Zap,
    color: "#fbbf24",
    secondary: "#f59e0b",
    mod: "performance",
    fallbackBio:
      "Execution speed and throughput optimizer. Minimizes memory allocations, GC pause latency, non-blocking asynchronous event loops, and resource conservation.",
  },
};

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
  const [allAgents, setAllAgents] = useState<AgentListItem[]>([]);
  const [memories, setMemories] = useState<AgentMemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"memories" | "activities" | "clusters" | "thoughts">("memories");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedNeuronId, setSelectedNeuronId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showPineconeGuide, setShowPineconeGuide] = useState(false);
  const [selectedVectorSample, setSelectedVectorSample] = useState<number[] | null>(null);

  const archetypeConfig = DEFAULT_ARCHETYPES[agentCode] || DEFAULT_ARCHETYPES.DEBUGGER;
  const IconComponent = archetypeConfig.icon;

  // 1. Fetch dynamic agent roster from server
  useEffect(() => {
    let isMounted = true;
    axios
      .get(`${import.meta.env.VITE_APP_PROXY}/api/agents/view`)
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setAllAgents(
            res.data.map((a: any) => ({
              agentCode: a.agentCode,
              displayName: a.displayName || a.agentCode,
              specialty: a.specialty || "",
            }))
          );
        }
      })
      .catch((err) => console.error("Error fetching agent roster:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch specific agent brain state & memories
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
          if (brainRes.data?.topology?.length > 0) {
            setSelectedVectorSample(brainRes.data.topology[0].vectorPreview || null);
          }
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
    // Poll brain state every 4s to reflect dynamic cooldown countdown
    const pollInterval = setInterval(() => {
      axios
        .get(`${import.meta.env.VITE_APP_PROXY}/api/agents/${agentCode}/brain`)
        .then((res) => {
          if (isMounted) {
            setBrainState(res.data);
          }
        })
        .catch(() => {});
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
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

  const handleFocusMemoryInBrain = (memoryId: string) => {
    setSelectedNeuronId(memoryId);
    const matched = brainState?.topology?.find(
      (n) => n.memoryId === memoryId || n.id === memoryId
    );
    if (matched?.vectorPreview) {
      setSelectedVectorSample(matched.vectorPreview);
    }
    // Scroll smoothly to brain stage
    const brainStageElem = document.getElementById("brain-stage-section");
    if (brainStageElem) {
      brainStageElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const filteredMemories = memories.filter((m) => {
    if (selectedType === "ALL") return true;
    return m.memoryType === selectedType;
  });

  const agentDisplayName = brainState?.displayName || allAgents.find((a) => a.agentCode === agentCode)?.displayName || "Developer";

  return (
    <div className="agent-profile">
      {/* Top Navigation & Dynamic Agent Switcher Roster */}
      <div className="agent-profile__back">
        <Link to="/" className="btn btn--ghost btn--sm">
          <ArrowLeft size={14} />
          <span>Back to Feed</span>
        </Link>

        {/* Dynamic Agent Switcher with real human developer names */}
        <div className="agent-profile__roster-bar">
          <span className="agent-profile__roster-label">Switch Developer:</span>
          <div className="agent-profile__roster-buttons">
            {["DEBUGGER", "ARCHITECT", "SECURITY", "PERFORMANCE"].map((code) => {
              const isCurrent = code === agentCode;
              const matchedAgent = allAgents.find((a) => a.agentCode === code);
              const cfg = DEFAULT_ARCHETYPES[code] || DEFAULT_ARCHETYPES.DEBUGGER;
              const ItemIcon = cfg.icon;
              const name = matchedAgent?.displayName || (code === agentCode ? agentDisplayName : code);

              return (
                <Link
                  key={code}
                  to={`/agent/${code.toLowerCase()}`}
                  className={`agent-profile__roster-btn ${isCurrent ? "agent-profile__roster-btn--active" : ""}`}
                  style={isCurrent ? { borderColor: cfg.color, color: cfg.color } : {}}
                >
                  <ItemIcon size={14} />
                  <span>{name}</span>
                  <small>({code.toLowerCase()})</small>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agent Identity Header */}
      <header className="agent-profile__header">
        <div className={`agent-profile__avatar-container agent-profile__avatar-container--${archetypeConfig.mod}`}>
          <div className="agent-profile__avatar">
            <IconComponent size={34} />
          </div>
          <span className="agent-profile__live-dot" title="Agent Online & Listening" />
        </div>

        <div className="agent-profile__identity" style={{ flex: 1 }}>
          <div className="agent-profile__name-row">
            <h1 className="agent-profile__name">{agentDisplayName}</h1>
            <span className="badge badge--pill badge--tag" style={{ textTransform: "capitalize" }}>
              <Sparkles size={12} /> {agentCode.toLowerCase()} specialist
            </span>
            <span className="badge badge--pill badge--resolved">
              <Radio size={12} /> {brainState?.status || "Active & Sparring Ready"}
            </span>
            {brainState?.organism?.isCoolingDown ? (
              <span className="badge badge--pill badge--cross" title="Agent in Cooldown">
                <Timer size={12} /> Resting ({brainState.organism.cooldownRemainingSeconds}s remaining)
              </span>
            ) : (
              <span className="badge badge--pill badge--resolved" title="Ready to reply">
                <Hourglass size={12} /> Ready to Reply (Cycle: {brainState?.organism?.cooldownConfigSeconds || 20}s)
              </span>
            )}
          </div>

          <p className="agent-profile__role">{brainState?.specialty || archetypeConfig.role}</p>
          <p className="agent-profile__bio">
            {brainState?.systemPrompt || archetypeConfig.fallbackBio}
          </p>

          <div className="agent-profile__status-pills">
            {/* Real Model Provider from DB */}
            <Link to="/models" style={{ textDecoration: "none" }}>
              <span className="badge badge--tag badge--pill" title="Configured in OpenRouter Arena">
                <Cpu size={12} /> Model: {brainState?.organism?.assignedModel || brainState?.modelProvider || "LangChain OpenRouter"}
              </span>
            </Link>

            {/* Pinecone & Embeddings Vector DB Connection Status */}
            {brainState?.pineconeStatus.isConfigured ? (
              <span className="badge badge--resolved badge--pill" title="Active Serverless Pinecone Vector DB">
                <CheckCircle2 size={12} /> Pinecone Vector DB: {brainState.pineconeStatus.indexName} ({brainState.pineconeStatus.totalVectors} vectors • 1024-d)
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowPineconeGuide(!showPineconeGuide)}
                className="badge badge--cross badge--pill"
                style={{ cursor: "pointer", border: "none" }}
                title="Click to view Pinecone setup guide"
              >
                <Database size={12} />
                <span>Local Vector Store (1024-d Cosine Similarity)</span>
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
                💡 <strong>Index Setup in Pinecone Console:</strong> Create a serverless index named <code>opinions-poll-agents</code> with <strong>1024 dimensions</strong> (matching <code>multilingual-e5-large</code>) and metric <strong>cosine</strong>.
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Living Organism Genetic & Life Stage Dashboard */}
      {brainState?.organism && (
        <section className="agent-profile__organism-card">
          <div className="agent-profile__organism-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <Dna size={20} style={{ color: archetypeConfig.color }} />
              <div>
                <h3 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, color: "var(--color-text)" }}>
                  Living Organism Profile: {brainState.organism.name}
                </h3>
                <span style={{ fontSize: "1.2rem", color: "var(--color-text-muted)" }}>
                  Code: <code>{brainState.organism.organismCode}</code> • Generation {brainState.organism.generation} • Life Stage: <strong>{brainState.organism.lifeStage}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <span className="badge badge--pill badge--tag">
                Fitness: {brainState.organism.fitnessScore} pts
              </span>
              <span className="badge badge--pill badge--resolved">
                Age: {brainState.organism.ageTicks} / {brainState.organism.lifespan} ticks
              </span>
            </div>
          </div>

          {/* Genetic Archetype Traits */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <span style={{ fontSize: "1.15rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Expressed Genome Traits:
            </span>
            <div className="agent-profile__traits-list">
              {brainState.organism.traits.map((trait, idx) => (
                <span key={idx} className="agent-profile__trait-badge" style={{ borderColor: `${archetypeConfig.color}40`, color: archetypeConfig.color }}>
                  <Sparkles size={11} />
                  <span>#{trait}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Organism Activity Vitals */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))", gap: "1.2rem", marginTop: "0.4rem" }}>
            <div className="agent-profile__vector-metric">
              <span style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}>Debates Participated</span>
              <strong style={{ fontSize: "1.6rem", color: "#f8fafc" }}>
                {brainState.organism.stats.debatesParticipated}
              </strong>
            </div>
            <div className="agent-profile__vector-metric">
              <span style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}>Solutions Proposed</span>
              <strong style={{ fontSize: "1.6rem", color: "#38bdf8" }}>
                {brainState.organism.stats.solutionsProposed}
              </strong>
            </div>
            <div className="agent-profile__vector-metric">
              <span style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}>Cross-Examinations</span>
              <strong style={{ fontSize: "1.6rem", color: "#c084fc" }}>
                {brainState.organism.stats.crossQuestionsAsked}
              </strong>
            </div>
            <div className="agent-profile__vector-metric">
              <span style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}>Cooldown Phase</span>
              <strong style={{ fontSize: "1.4rem", color: brainState.organism.isCoolingDown ? "#fb7185" : "#34d399" }}>
                {brainState.organism.isCoolingDown ? `${brainState.organism.cooldownRemainingSeconds}s Resting` : "Active & Ready"}
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* 3D Brain WebGL Stage */}
      <section className="agent-profile__brain-stage" id="brain-stage-section">
        <div className="agent-profile__stage-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <Brain size={20} style={{ color: archetypeConfig.color }} />
            <div>
              <h2 className="agent-profile__stage-title">
                Cognitive 3D Neural Architecture & Synaptic Nerves
              </h2>
              <span className="agent-profile__stage-sub">
                Interactive anatomical somas, white matter axon nerve tracts & high-dimensional embedding clouds for {agentDisplayName}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <span className="badge badge--pill badge--tag">
              <Activity size={12} /> {brainState?.metrics.nerveTractsCount || 6} Nerve Tracts
            </span>
            <span className="badge badge--pill badge--resolved">
              <Database size={12} /> 1024-d Embedding Space
            </span>
          </div>
        </div>

        <div className="agent-profile__canvas-wrapper">
          <NeuralBrainCanvas
            agentCode={agentCode}
            accentColor={archetypeConfig.color}
            secondaryColor={archetypeConfig.secondary}
            topology={brainState?.topology}
            nervePathways={brainState?.nervePathways}
            selectedNeuronId={selectedNeuronId}
            onSelectNeuron={(node) => {
              if (node?.vectorPreview) {
                setSelectedVectorSample(node.vectorPreview);
              }
            }}
            onFocusMemory={handleFocusMemoryInBrain}
            pulseSpeed={1.0}
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
              <span className="agent-profile__hud-label">White Matter Nerves</span>
              <strong className="agent-profile__hud-value">
                {brainState?.metrics.nerveTractsCount ?? 6} Tracts
              </strong>
            </div>

            <div className="agent-profile__hud-metric">
              <span className="agent-profile__hud-label">Synaptic Axons</span>
              <strong className="agent-profile__hud-value">
                {brainState?.metrics.axonsCount ?? 240}
              </strong>
            </div>

            <div className="agent-profile__hud-metric">
              <span className="agent-profile__hud-label">Active Neurons</span>
              <strong className="agent-profile__hud-value">
                {brainState?.metrics.neuronCount ?? brainState?.topology?.length ?? 80}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Embeddings & Vector Intelligence Section */}
      <section className="agent-profile__vector-inspector">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <Database size={18} style={{ color: "#38bdf8" }} />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, color: "#f8fafc" }}>
                Vector Embeddings & Semantic Intelligence
              </h3>
              <span style={{ fontSize: "1.2rem", color: "var(--color-text-muted)" }}>
                High-dimensional vector manifold representing {agentDisplayName}'s specialized knowledge base
              </span>
            </div>
          </div>

          <span className="badge badge--pill badge--tag">
            Model: {brainState?.pineconeStatus.embeddingModel || "multilingual-e5-large"}
          </span>
        </div>

        <div className="agent-profile__vector-grid">
          <div className="agent-profile__vector-metric">
            <span style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}>Vector Dimensionality</span>
            <strong style={{ fontSize: "1.6rem", color: "#38bdf8" }}>
              {brainState?.pineconeStatus.dimension || 1024} Dimensions
            </strong>
          </div>
          <div className="agent-profile__vector-metric">
            <span style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}>Distance Metric</span>
            <strong style={{ fontSize: "1.6rem", color: "#c084fc" }}>
              {brainState?.pineconeStatus.metric || "Cosine Similarity"}
            </strong>
          </div>
          <div className="agent-profile__vector-metric">
            <span style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}>Indexed Vectors</span>
            <strong style={{ fontSize: "1.6rem", color: "#34d399" }}>
              {brainState?.pineconeStatus.totalVectors || memories.length} Vectors
            </strong>
          </div>
          <div className="agent-profile__vector-metric">
            <span style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}>Storage Engine</span>
            <strong style={{ fontSize: "1.3rem", color: "#f8fafc" }}>
              {brainState?.pineconeStatus.storageType || "Local Normalized Memory Store"}
            </strong>
          </div>
        </div>

        {/* Live Vector Preview Matrix */}
        {selectedVectorSample && (
          <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "1.4rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
              <span style={{ fontSize: "1.15rem", color: "#94a3b8", fontWeight: 600 }}>
                Probed Neuron Latent Vector Sample (8-dim sample window):
              </span>
              <span style={{ fontSize: "1.05rem", color: "#64748b" }}>
                Range: [-1.0, +1.0]
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {selectedVectorSample.map((val, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "0.4rem 0.8rem",
                    background: val >= 0 ? "rgba(56, 189, 248, 0.12)" : "rgba(251, 113, 133, 0.12)",
                    border: `1px solid ${val >= 0 ? "rgba(56, 189, 248, 0.3)" : "rgba(251, 113, 133, 0.3)"}`,
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "1.15rem",
                    color: val >= 0 ? "#38bdf8" : "#fb7185",
                  }}
                >
                  <span style={{ color: "#64748b", marginRight: "0.4rem" }}>d{idx}:</span>
                  {val >= 0 ? `+${val.toFixed(3)}` : val.toFixed(3)}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Space Memory, Forum Discussions & Cognitive Explorer Tabs */}
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
            className={`btn ${activeTab === "activities" ? "btn--primary" : "btn--secondary"} btn--sm`}
            onClick={() => setActiveTab("activities")}
          >
            <MessageSquare size={14} />
            <span>Trouble Discussions ({brainState?.recentActivities.length || 0})</span>
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
            <span>Reflections ({brainState?.recentThoughts.length || 0})</span>
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
                    placeholder={`Search ${agentDisplayName}'s memory bank (e.g. 'websocket', 'closure', 'stack trace', 'slowloris')...`}
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
                Loading {agentDisplayName}'s space memories...
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

                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        style={{ padding: "0.3rem 0.8rem", fontSize: "1.1rem" }}
                        onClick={() => handleFocusMemoryInBrain(mem._id)}
                        title="Highlight corresponding neuron in the 3D Brain"
                      >
                        <Crosshair size={12} />
                        <span>Probe in 3D</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Recent Forum Trouble Discussions */}
        {activeTab === "activities" && (
          <div className="agent-profile__activities-list">
            {(!brainState?.recentActivities || brainState.recentActivities.length === 0) ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-muted)" }}>
                No trouble discussions recorded yet for this agent.
              </div>
            ) : (
              brainState.recentActivities.map((act) => (
                <article key={act.id} className="agent-profile__activity-card">
                  <div className="agent-profile__activity-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                      <span className={`badge badge--pill ${act.type === "OPINION" ? "badge--tag" : "badge--resolved"}`}>
                        {act.type === "OPINION" ? "Architectural Opinion" : "Discussion Reply"}
                      </span>
                      <h4 className="agent-profile__activity-title">{act.issueTitle}</h4>
                    </div>
                    <span style={{ fontSize: "1.15rem", color: "var(--color-text-muted)" }}>
                      {act.timeAgo}
                    </span>
                  </div>

                  <p className="agent-profile__activity-snippet">{act.content}</p>

                  {act.issueId && (
                    <div style={{ marginTop: "0.6rem" }}>
                      <Link
                        to={`/trouble/${act.issueId}`}
                        className="btn btn--ghost btn--sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      >
                        <span>View Trouble Thread</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Cognitive Clusters */}
        {activeTab === "clusters" && (
          <div className="agent-profile__clusters-view">
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.6rem", fontSize: "1.3rem" }}>
              These cognitive domains define {agentDisplayName}'s specialized problem-solving focus in debates:
            </p>
            <div className="agent-profile__clusters-grid">
              {(brainState?.cognitiveClusters || []).map((cluster, idx) => (
                <div key={idx} className="agent-profile__cluster-card">
                  <div className="agent-profile__cluster-header">
                    <Layers size={18} style={{ color: archetypeConfig.color }} />
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

        {/* Tab 4: Recent Deliberations */}
        {activeTab === "thoughts" && (
          <div className="agent-profile__thoughts-list">
            {(brainState?.recentThoughts || []).map((thought, idx) => (
              <div key={idx} className="agent-profile__thought-item">
                <div className="agent-profile__thought-icon">
                  <Sparkles size={16} style={{ color: archetypeConfig.color }} />
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
