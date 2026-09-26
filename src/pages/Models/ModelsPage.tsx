import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  Bot, 
  Cpu, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Bug, 
  Check, 
  ExternalLink, 
  Layers, 
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Filter
} from "lucide-react";

interface EnrichedModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  provider: string;
  isFree: boolean;
  pricing: {
    promptPerMillion: number;
    completionPerMillion: number;
    rawPrompt: string;
    rawCompletion: string;
  };
  architecture?: {
    modality: string;
    tokenizer: string;
  };
  isModerated?: boolean;
}

interface SparringConfig {
  configKey: string;
  agentModelMap: Record<string, string>;
  activeSparringModels: string[];
  defaultModel: string;
}

const TOP_PROVIDERS = [
  "all",
  "free-tier",
  "openai",
  "anthropic",
  "google",
  "meta-llama",
  "deepseek",
  "mistralai",
  "qwen",
  "cohere",
];

const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<EnrichedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [sparringConfig, setSparringConfig] = useState<SparringConfig>({
    configKey: "default",
    agentModelMap: {
      DEBUGGER: "google/gemma-4-31b-it:free",
      ARCHITECT: "anthropic/claude-3.5-sonnet",
      SECURITY: "meta-llama/llama-3.1-70b-instruct",
      PERFORMANCE: "mistralai/codestral-2501",
    },
    activeSparringModels: [],
    defaultModel: "google/gemma-4-31b-it:free",
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [contextFilter, setContextFilter] = useState<"all" | "32k" | "64k" | "128k">("all");
  const [sortOption, setSortOption] = useState<"default" | "context-desc" | "name-asc">("default");
  const [displayCount, setDisplayCount] = useState(24);

  // Fetch models and sparring config
  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const [modelsRes, configRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_APP_PROXY}/api/models${forceRefresh ? "?refresh=true" : ""}`),
        axios.get(`${import.meta.env.VITE_APP_PROXY}/api/models/sparring-config`),
      ]);

      if (modelsRes.data?.models) {
        setModels(modelsRes.data.models);
      }
      if (configRes.data) {
        setSparringConfig(configRes.data);
      }
    } catch (err) {
      console.error("Failed to load models data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Agent Model in local state
  const handleAgentModelChange = (agentCode: string, modelId: string) => {
    setSparringConfig((prev) => ({
      ...prev,
      agentModelMap: {
        ...prev.agentModelMap,
        [agentCode]: modelId,
      },
    }));
  };

  // Save Swarm Model Configuration to Server
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setSaveMessage(null);
    try {
      await axios.post(`${import.meta.env.VITE_APP_PROXY}/api/models/sparring-config`, {
        agentModelMap: sparringConfig.agentModelMap,
        activeSparringModels: sparringConfig.activeSparringModels,
        defaultModel: sparringConfig.defaultModel,
      });
      setSaveMessage("Swarm model assignments saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage("Failed to save configuration.");
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSavingConfig(false);
    }
  };

  // Quick assign model to a particular agent
  const handleQuickAssign = (agentCode: string, modelId: string) => {
    handleAgentModelChange(agentCode, modelId);
    setSaveMessage(`Assigned to ${agentCode}! Remember to save changes.`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Toggle model in active sparring pool
  const handleToggleSparringModel = (modelId: string) => {
    setSparringConfig((prev) => {
      const exists = prev.activeSparringModels.includes(modelId);
      const updated = exists
        ? prev.activeSparringModels.filter((id) => id !== modelId)
        : [...prev.activeSparringModels, modelId];
      return { ...prev, activeSparringModels: updated };
    });
  };

  // Filtered and sorted models
  const filteredModels = useMemo(() => {
    return models
      .filter((m) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = m.name.toLowerCase().includes(q);
          const matchId = m.id.toLowerCase().includes(q);
          const matchDesc = m.description.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchDesc) return false;
        }

        // Provider or Free-Tier tab
        if (selectedProvider === "free-tier") {
          if (!m.isFree) return false;
        } else if (selectedProvider !== "all") {
          if (m.provider.toLowerCase() !== selectedProvider.toLowerCase()) return false;
        }

        // Context filter
        if (contextFilter === "32k" && m.contextLength < 32000) return false;
        if (contextFilter === "64k" && m.contextLength < 64000) return false;
        if (contextFilter === "128k" && m.contextLength < 128000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "context-desc") {
          return b.contextLength - a.contextLength;
        }
        if (sortOption === "name-asc") {
          return a.name.localeCompare(b.name);
        }
        // Default: free models and top models first
        if (a.isFree && !b.isFree) return -1;
        if (!a.isFree && b.isFree) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [models, searchQuery, selectedProvider, contextFilter, sortOption]);

  const agentsRoster = [
    {
      code: "DEBUGGER",
      name: "Dexter (Debugger)",
      specialty: "Runtime Traces, Exceptions, Closures",
      mod: "debugger",
      icon: Bug,
    },
    {
      code: "ARCHITECT",
      name: "Ada (Architect)",
      specialty: "System Architecture, Modular Patterns",
      mod: "architect",
      icon: Cpu,
    },
    {
      code: "SECURITY",
      name: "Sentinel (Security)",
      specialty: "Sanitization, Injection, Auth Audits",
      mod: "security",
      icon: ShieldCheck,
    },
    {
      code: "PERFORMANCE",
      name: "Turbo (Performance)",
      specialty: "Event Loop Lag, Memory & Throughput",
      mod: "performance",
      icon: Zap,
    },
  ];

  return (
    <div className="models-arena">
      {/* Hero Header */}
      <div className="models-arena__hero">
        <div className="models-arena__hero-top">
          <div className="models-arena__hero-title">
            <Bot size={28} className="text-primary" />
            <span>OpenRouter Model Arena</span>
          </div>

          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
            <span className="badge badge--resolved badge--pill">
              <CheckCircle2 size={13} /> OpenRouter Connected
            </span>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => fetchData(true)}
              disabled={loading}
              title="Refresh models from OpenRouter"
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
              <span>Refresh Catalog</span>
            </button>
          </div>
        </div>

        <p className="models-arena__hero-desc">
          Configure specialized LLM models to power the multi-agent sparring arena. Each AI agent can be driven by a distinct foundation model via OpenRouter and LangChain for maximum diversity of opinion.
        </p>

        <div className="models-arena__stats-bar">
          <span className="models-arena__stat-badge">
            Total Catalog: <strong>{models.length} Models</strong>
          </span>
          <span className="models-arena__stat-badge">
            Free Tier: <strong>{models.filter((m) => m.isFree).length} Available</strong>
          </span>
          <span className="models-arena__stat-badge">
            Swarm Agents: <strong>4 Configured</strong>
          </span>
          <span className="models-arena__stat-badge">
            Active Sparring Pool: <strong>{sparringConfig.activeSparringModels.length} Models</strong>
          </span>
        </div>
      </div>

      {/* Swarm Agent Model Assignment Matrix */}
      <section className="models-arena__assignment-section">
        <div className="models-arena__section-header">
          <div>
            <h3 className="models-arena__section-title">
              <Sparkles size={20} className="text-primary" />
              <span>Agent Model Assignments</span>
            </h3>
            <p style={{ fontSize: "1.3rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
              Assign foundation models to each specialized agent in the debugging swarm
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {saveMessage && (
              <span className="badge badge--resolved badge--pill" style={{ padding: "0.5rem 1.2rem" }}>
                {saveMessage}
              </span>
            )}
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleSaveConfig}
              disabled={savingConfig}
            >
              <Check size={16} className="btn__icon" />
              <span className="btn__text">
                {savingConfig ? "Saving..." : "Save Swarm Configuration"}
              </span>
            </button>
          </div>
        </div>

        <div className="models-arena__agents-grid">
          {agentsRoster.map((agent) => {
            const AgentIcon = agent.icon;
            const currentModelId = sparringConfig.agentModelMap[agent.code] || "";

            return (
              <div
                key={agent.code}
                className={`agent-assign-card agent-assign-card--${agent.mod}`}
              >
                <div className="agent-assign-card__header">
                  <div className={`agent-assign-card__avatar agent-assign-card__avatar--${agent.mod}`}>
                    <AgentIcon size={20} />
                  </div>
                  <div className="agent-assign-card__meta">
                    <span className="agent-assign-card__name">{agent.name}</span>
                    <span className="agent-assign-card__specialty">{agent.specialty}</span>
                  </div>
                </div>

                <div className="agent-assign-card__select-wrap">
                  <label className="agent-assign-card__label">Active Model</label>
                  <select
                    className="agent-assign-card__select"
                    value={currentModelId}
                    onChange={(e) => handleAgentModelChange(agent.code, e.target.value)}
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.isFree ? "[FREE] " : ""}{m.name} ({Math.round(m.contextLength / 1000)}k ctx)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Model Filtering & Search Controls */}
      <section className="models-arena__filter-card">
        <div className="models-arena__filter-row">
          <div className="models-arena__search-box">
            <Search size={18} className="models-arena__search-icon" />
            <input
              type="text"
              className="models-arena__search-input"
              placeholder="Search 450+ models by name, slug (e.g. claude, gpt-4o, llama), or provider..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayCount(24);
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
            <select
              className="agent-assign-card__select"
              style={{ width: "auto", minWidth: "150px" }}
              value={contextFilter}
              onChange={(e) => setContextFilter(e.target.value as any)}
            >
              <option value="all">Any Context</option>
              <option value="32k">&gt; 32k Window</option>
              <option value="64k">&gt; 64k Window</option>
              <option value="128k">&gt; 128k Window</option>
            </select>

            <select
              className="agent-assign-card__select"
              style={{ width: "auto", minWidth: "150px" }}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
            >
              <option value="default">Sort: Free & Popular</option>
              <option value="context-desc">Sort: Largest Context</option>
              <option value="name-asc">Sort: A-Z</option>
            </select>
          </div>
        </div>

        {/* Provider Filter Tabs */}
        <div className="models-arena__provider-tabs">
          {TOP_PROVIDERS.map((provider) => (
            <button
              key={provider}
              type="button"
              className={`models-arena__provider-btn ${
                selectedProvider === provider ? "models-arena__provider-btn--active" : ""
              }`}
              onClick={() => {
                setSelectedProvider(provider);
                setDisplayCount(24);
              }}
            >
              {provider === "all"
                ? "All Providers"
                : provider === "free-tier"
                ? "★ Free Models"
                : provider}
            </button>
          ))}
        </div>
      </section>

      {/* Models Grid */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "1.35rem", color: "var(--color-text-secondary)" }}>
            Showing {Math.min(filteredModels.length, displayCount)} of {filteredModels.length} matching models
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            <RefreshCw size={28} className="spin" style={{ margin: "0 auto 1rem auto" }} />
            <span>Fetching model weights & rates from OpenRouter...</span>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="trouble-card" style={{ textAlign: "center", padding: "4rem" }}>
            <Filter size={36} style={{ margin: "0 auto 1rem auto", color: "var(--color-text-muted)" }} />
            <h4 style={{ fontSize: "1.6rem" }}>No models match your current filters</h4>
            <p style={{ marginTop: "0.5rem" }}>Try clearing search keywords or resetting provider tabs.</p>
          </div>
        ) : (
          <div className="models-grid">
            {filteredModels.slice(0, displayCount).map((model) => {
              const isSparring = sparringConfig.activeSparringModels.includes(model.id);

              return (
                <div
                  key={model.id}
                  className={`model-card ${isSparring ? "model-card--active-sparring" : ""}`}
                >
                  <div className="model-card__header">
                    <div className="model-card__title-group">
                      <span className="model-card__provider-badge">{model.provider}</span>
                      <h4 className="model-card__name">{model.name}</h4>
                      <span className="model-card__id">{model.id}</span>
                    </div>

                    {model.isFree ? (
                      <span className="badge badge--resolved badge--pill">Free</span>
                    ) : (
                      <span className="badge badge--tag">
                        ${model.pricing.promptPerMillion}/1M
                      </span>
                    )}
                  </div>

                  <p className="model-card__description">
                    {model.description || "High-performance foundation LLM ready for agentic sparring."}
                  </p>

                  <div className="model-card__meta-chips">
                    <span className="badge badge--tag">
                      {Math.round(model.contextLength / 1000)}k Context
                    </span>
                    <span className="badge badge--tag">
                      {model.architecture?.modality || "text"}
                    </span>
                    {isSparring && (
                      <span className="badge badge--debugger badge--pill">
                        Sparring Enabled
                      </span>
                    )}
                  </div>

                  <div className="model-card__footer">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem", cursor: "pointer", color: "var(--color-text-secondary)" }}>
                        <input
                          type="checkbox"
                          checked={isSparring}
                          onChange={() => handleToggleSparringModel(model.id)}
                        />
                        <span>Sparring Pool</span>
                      </label>
                    </div>

                    <div className="model-card__actions">
                      <select
                        className="agent-assign-card__select"
                        style={{ padding: "0.4rem 0.8rem", fontSize: "1.15rem", width: "auto" }}
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleQuickAssign(e.target.value, model.id);
                          }
                        }}
                      >
                        <option value="" disabled>
                          Assign to...
                        </option>
                        <option value="DEBUGGER">Debugger</option>
                        <option value="ARCHITECT">Architect</option>
                        <option value="SECURITY">Security</option>
                        <option value="PERFORMANCE">Performance</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredModels.length > displayCount && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setDisplayCount((prev) => prev + 24)}
            >
              <span>Load More Models ({filteredModels.length - displayCount} remaining)</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default ModelsPage;
