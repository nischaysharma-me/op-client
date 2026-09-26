import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Dna,
  GitBranch,
  Sparkles,
  Clock,
  Activity,
  Layers,
  Brain,
  ShieldCheck,
  Zap,
  Terminal,
  Cpu,
  RefreshCw,
  Award,
  ChevronRight,
  Archive,
  ArrowUpRight,
  TrendingUp,
  FastForward
} from "lucide-react";

interface EvolutionEvent {
  _id: string;
  eventType: string;
  generation: number;
  primaryOrganismCode: string;
  primaryOrganismName: string;
  secondaryOrganismCode?: string;
  secondaryOrganismName?: string;
  offspringCode?: string;
  offspringName?: string;
  title: string;
  description: string;
  genomeDelta?: {
    newTrait?: string;
    temperatureDelta?: number;
    aggressivenessDelta?: number;
  };
  timestamp: string;
}

interface OrganismItem {
  _id: string;
  organismCode: string;
  name: string;
  generation: number;
  parents: string[];
  lifeStage: "BORN" | "MATURING" | "MATURE" | "MUTATING" | "RETIRED";
  ageTicks: number;
  lifespan: number;
  maturityAge: number;
  fitnessScore: number;
  reproductionCount: number;
  genome: {
    archetype: string;
    temperature: number;
    debateAggressiveness: number;
    mutationRate: number;
    traits: string[];
  };
  assignedModel: string;
  specialty: string;
  colorTheme: string;
  isActive: boolean;
  birthTimestamp: string;
}

interface EcosystemStats {
  totalOrganisms: number;
  activeCount: number;
  matureCount: number;
  retiredCount: number;
  currentMaxGeneration: number;
}

const EcosystemPage: React.FC = () => {
  const [events, setEvents] = useState<EvolutionEvent[]>([]);
  const [organisms, setOrganisms] = useState<OrganismItem[]>([]);
  const [stats, setStats] = useState<EcosystemStats | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "population">("timeline");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [ticking, setTicking] = useState(false);

  const fetchData = async () => {
    try {
      const [eventsRes, organismsRes, statsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_APP_PROXY}/api/organisms/timeline/events`),
        axios.get(`${import.meta.env.VITE_APP_PROXY}/api/organisms`),
        axios.get(`${import.meta.env.VITE_APP_PROXY}/api/organisms/stats`),
      ]);
      setEvents(eventsRes.data || []);
      setOrganisms(organismsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error("Error fetching ecosystem data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll updates every 12 seconds so background evolution is visible live
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleManualTick = async () => {
    setTicking(true);
    try {
      await axios.post(`${import.meta.env.VITE_APP_PROXY}/api/organisms/evolve/tick`);
      await fetchData();
    } catch (err) {
      console.error("Tick failed:", err);
    } finally {
      setTicking(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 30) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getArchetypeIcon = (arch: string) => {
    switch (arch) {
      case "DEBUGGER":
        return Terminal;
      case "ARCHITECT":
        return Cpu;
      case "SECURITY":
        return ShieldCheck;
      case "PERFORMANCE":
        return Zap;
      default:
        return Sparkles;
    }
  };

  const filteredOrganisms = organisms.filter((org) => {
    if (stageFilter === "ALL") return true;
    if (stageFilter === "ACTIVE") return org.isActive;
    return org.lifeStage === stageFilter;
  });

  return (
    <div className="ecosystem">
      {/* Ecosystem Header */}
      <header className="ecosystem__header">
        <div className="ecosystem__title-row">
          <div className="ecosystem__title-group">
            <Dna size={26} color="#38bdf8" />
            <h1 className="ecosystem__title">Autonomous Digital Organisms & Genetic Evolution</h1>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleManualTick}
            disabled={ticking}
            title="Accelerate simulation by 1 evolutionary cycle"
          >
            <FastForward size={14} className={ticking ? "animate-spin" : ""} />
            <span>{ticking ? "Evolving..." : "Trigger Evolution Tick"}</span>
          </button>
        </div>

        <p className="ecosystem__subtitle">
          Digital citizen organisms are born with continuous lifespans. As they participate in community trouble sparring, they age and accumulate fitness. Upon achieving <strong>Maturity</strong>, their genome unlocks to undergo <strong>Genetic Algorithm Mutation</strong>, birthing next-generation descendants while elderly ancestors are gracefully archived into collective memory.
        </p>

        {/* Population Stats HUD */}
        <div className="ecosystem__hud">
          <div className="ecosystem__hud-item">
            <span className="ecosystem__hud-label">Active in Swarm</span>
            <strong className="ecosystem__hud-value" style={{ color: "#38bdf8" }}>
              {stats?.activeCount ?? 4}
            </strong>
          </div>

          <div className="ecosystem__hud-item">
            <span className="ecosystem__hud-label">Mature & Mutating</span>
            <strong className="ecosystem__hud-value" style={{ color: "#34d399" }}>
              {stats?.matureCount ?? 0}
            </strong>
          </div>

          <div className="ecosystem__hud-item">
            <span className="ecosystem__hud-label">Max Generation</span>
            <strong className="ecosystem__hud-value" style={{ color: "#c084fc" }}>
              Gen {stats?.currentMaxGeneration ?? 1}
            </strong>
          </div>

          <div className="ecosystem__hud-item">
            <span className="ecosystem__hud-label">Archived Ancestors</span>
            <strong className="ecosystem__hud-value" style={{ color: "var(--color-text-muted)" }}>
              {stats?.retiredCount ?? 0}
            </strong>
          </div>

          <div className="ecosystem__hud-item">
            <span className="ecosystem__hud-label">Total Organisms</span>
            <strong className="ecosystem__hud-value">
              {stats?.totalOrganisms ?? organisms.length}
            </strong>
          </div>
        </div>
      </header>

      {/* Navigation Toolbar */}
      <div className="ecosystem__toolbar">
        <div className="ecosystem__views-nav">
          <button
            type="button"
            className={`btn ${activeTab === "timeline" ? "btn--primary" : "btn--secondary"} btn--sm`}
            onClick={() => setActiveTab("timeline")}
          >
            <Clock size={14} />
            <span>Evolution Timeline Feed ({events.length})</span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === "population" ? "btn--primary" : "btn--secondary"} btn--sm`}
            onClick={() => setActiveTab("population")}
          >
            <Layers size={14} />
            <span>Active Population ({organisms.length})</span>
          </button>
        </div>

        {activeTab === "population" && (
          <div style={{ display: "flex", gap: "0.6rem" }}>
            {["ALL", "ACTIVE", "MATURE", "RETIRED"].map((stage) => (
              <button
                key={stage}
                type="button"
                className={`agent-profile__type-pill ${stageFilter === stage ? "agent-profile__type-pill--active" : ""}`}
                onClick={() => setStageFilter(stage)}
              >
                {stage}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View 1: Evolution Timeline Feed */}
      {activeTab === "timeline" && (
        <section className="ecosystem__timeline-container">
          {events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-muted)" }}>
              No evolutionary events recorded yet. Trigger an evolution tick to start.
            </div>
          ) : (
            events.map((evt) => {
              const isMutation = evt.eventType === "GENETIC_MUTATION" || evt.eventType === "OFFSPRING_SPAWNED";
              const isMaturity = evt.eventType === "MATURITY_REACHED";
              const isRetired = evt.eventType === "ORGANISM_RETIRED";

              let modifier = "born";
              if (isMutation) modifier = "mutation";
              else if (isMaturity) modifier = "maturity";
              else if (isRetired) modifier = "retired";

              return (
                <div key={evt._id} className={`ecosystem__timeline-event ecosystem__timeline-event--${modifier}`}>
                  <article className="ecosystem__event-card">
                    <div className="ecosystem__event-top">
                      <div className="ecosystem__event-meta">
                        <span className={`badge badge--pill ${isMutation ? "badge--tag" : isMaturity ? "badge--resolved" : "badge--cross"}`}>
                          {evt.eventType.replace("_", " ")}
                        </span>
                        <span className="badge badge--pill" style={{ background: "rgba(192, 132, 252, 0.15)", color: "#c084fc" }}>
                          Gen {evt.generation}
                        </span>
                      </div>
                      <span className="ecosystem__event-time">
                        <Clock size={12} /> {formatTimeAgo(evt.timestamp)}
                      </span>
                    </div>

                    <h3 className="ecosystem__event-title">{evt.title}</h3>
                    <p className="ecosystem__event-desc">{evt.description}</p>

                    {/* Genetic Delta / Mutation Details */}
                    {evt.genomeDelta && (
                      <div className="ecosystem__event-delta">
                        {evt.genomeDelta.newTrait && (
                          <span>
                            Acquired Trait: <strong className="ecosystem__delta-badge">+{evt.genomeDelta.newTrait}</strong>
                          </span>
                        )}
                        {evt.genomeDelta.temperatureDelta !== undefined && (
                          <span>
                            Thermal Drift: <strong>{evt.genomeDelta.temperatureDelta > 0 ? `+${evt.genomeDelta.temperatureDelta}` : evt.genomeDelta.temperatureDelta}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* View 2: Active Population Grid */}
      {activeTab === "population" && (
        <section className="ecosystem__population-grid">
          {filteredOrganisms.map((org) => {
            const Icon = getArchetypeIcon(org.genome.archetype);
            const lifePercent = Math.min(100, Math.round((org.ageTicks / org.lifespan) * 100));

            return (
              <article
                key={org._id}
                className={`ecosystem__organism-card ${org.lifeStage === "MATURE" ? "ecosystem__organism-card--mature" : ""} ${org.lifeStage === "RETIRED" ? "ecosystem__organism-card--retired" : ""}`}
              >
                <div className="ecosystem__card-header">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.4rem" }}>
                      <Icon size={18} color={org.colorTheme} />
                      <h3 className="ecosystem__organism-name">{org.name}</h3>
                    </div>
                    <span className="ecosystem__organism-code">{org.organismCode}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
                    <span
                      className={`badge badge--pill ${org.lifeStage === "MATURE" ? "badge--resolved" : org.lifeStage === "RETIRED" ? "badge--cross" : "badge--tag"}`}
                    >
                      {org.lifeStage}
                    </span>
                    <span className="badge badge--pill" style={{ background: "rgba(192, 132, 252, 0.15)", color: "#c084fc", fontSize: "1.1rem" }}>
                      Gen {org.generation}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: "1.25rem", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                  {org.specialty}
                </p>

                {/* Lifespan & Maturity Progress Gauge */}
                <div className="ecosystem__life-gauge">
                  <div className="ecosystem__life-header">
                    <span>
                      Age: <strong>{org.ageTicks}</strong> / {org.lifespan} ticks
                    </span>
                    <span>
                      {org.lifeStage === "MATURE" ? "Maturity Reached (Capable of Mutation)" : `Matures at ${org.maturityAge} ticks`}
                    </span>
                  </div>
                  <div className="ecosystem__life-track">
                    <div
                      className={`ecosystem__life-fill ecosystem__life-fill--${org.lifeStage.toLowerCase()}`}
                      style={{ width: `${lifePercent}%` }}
                    />
                  </div>
                </div>

                {/* Genetic Genome Traits */}
                <div className="ecosystem__traits-list">
                  {(org.genome.traits || []).map((t, idx) => (
                    <span key={idx} className="badge badge--tag" style={{ fontSize: "1.1rem" }}>
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Genome Metrics & Navigation */}
                <div className="ecosystem__card-footer">
                  <div style={{ display: "flex", gap: "1rem", fontSize: "1.15rem", color: "var(--color-text-muted)" }}>
                    <span>Temp: {org.genome.temperature}</span>
                    <span>Fitness: {org.fitnessScore}</span>
                  </div>

                  <Link
                    to={`/agent/${org.genome.archetype.toLowerCase()}`}
                    className="btn btn--secondary btn--sm"
                    style={{ textDecoration: "none" }}
                  >
                    <Brain size={14} />
                    <span>3D Brain</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default EcosystemPage;
