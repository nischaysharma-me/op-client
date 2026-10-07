import React, { useState, useMemo } from "react";
import {
  Layers,
  Activity,
  Zap,
  Sparkles,
  Database,
  Crosshair,
  BarChart3,
  Network,
  Cpu,
  TrendingUp,
  Percent,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { NeuronNodeData, NervePathwayData } from "./R3FNeuralBrain";

interface BrainAnalyticsGraphProps {
  agentCode: string;
  displayName: string;
  accentColor?: string;
  secondaryColor?: string;
  topology?: NeuronNodeData[];
  nervePathways?: NervePathwayData[];
  metrics?: {
    totalMemories: number;
    episodicCount: number;
    semanticCount: number;
    reflexiveCount: number;
    solutionsCount: number;
    neuronCount: number;
    axonsCount: number;
    nerveTractsCount: number;
  };
  onSelectNode?: (node: NeuronNodeData) => void;
}

const TYPE_COLORS: Record<string, string> = {
  SOLUTION_KNOWLEDGE: "#38bdf8",
  EPISODIC: "#34d399",
  SEMANTIC: "#c084fc",
  REFLEXIVE: "#fbbf24",
};

const BrainAnalyticsGraph: React.FC<BrainAnalyticsGraphProps> = ({
  agentCode,
  displayName,
  accentColor = "#38bdf8",
  secondaryColor = "#c084fc",
  topology = [],
  nervePathways = [],
  metrics,
  onSelectNode,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NeuronNodeData | null>(null);
  const [filterLobe, setFilterLobe] = useState<string>("ALL");

  // 1. Calculate Analytics Metrics from topology
  const lobeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Frontal (Executive)": 0,
      "Temporal (Episodic Memory)": 0,
      "Parietal (Semantic Knowledge)": 0,
      "Cerebellar (Reflexive Instincts)": 0,
    };
    topology.forEach((n) => {
      const lobe = n.lobe || "Frontal (Executive)";
      counts[lobe] = (counts[lobe] || 0) + 1;
    });
    return counts;
  }, [topology]);

  const totalTopologyCount = Math.max(1, topology.length);

  // Synaptic Activation potential breakdown
  const activationTiers = useMemo(() => {
    let high = 0; // > 0.75
    let med = 0;  // 0.5 - 0.75
    let low = 0;  // < 0.5
    topology.forEach((n) => {
      const val = n.intensity || 0.5;
      if (val >= 0.75) high++;
      else if (val >= 0.5) med++;
      else low++;
    });
    return {
      high,
      med,
      low,
      highPct: Math.round((high / totalTopologyCount) * 100),
      medPct: Math.round((med / totalTopologyCount) * 100),
      lowPct: Math.round((low / totalTopologyCount) * 100),
    };
  }, [topology, totalTopologyCount]);

  // 2. 2D Interactive Topological Network Graph Projection
  // Project 3D nodes into 2D SVG canvas with cluster layout
  const projectedNodes = useMemo(() => {
    const svgWidth = 640;
    const svgHeight = 360;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;

    return topology.slice(0, 48).map((node, idx) => {
      // Polar dispersion based on lobe and index
      let baseAngle = 0;
      if (node.lobe?.includes("Frontal")) baseAngle = -Math.PI / 4;
      else if (node.lobe?.includes("Temporal")) baseAngle = Math.PI * 0.75;
      else if (node.lobe?.includes("Parietal")) baseAngle = Math.PI / 4;
      else baseAngle = -Math.PI * 0.75;

      const spread = (idx % 12 - 6) * 0.18;
      const radius = 90 + (idx % 5) * 24;

      const px = centerX + Math.cos(baseAngle + spread) * radius + node.x * 16;
      const py = centerY + Math.sin(baseAngle + spread) * radius + node.y * 14;

      return {
        ...node,
        px,
        py,
        color: node.type && TYPE_COLORS[node.type] ? TYPE_COLORS[node.type] : accentColor,
      };
    });
  }, [topology, accentColor]);

  // Network graph edges
  const networkEdges = useMemo(() => {
    const edges: Array<{ x1: number; y1: number; x2: number; y2: number; color: string; id: string }> = [];
    for (let i = 0; i < projectedNodes.length; i++) {
      for (let j = i + 1; j < projectedNodes.length; j++) {
        const dx = projectedNodes[i].px - projectedNodes[j].px;
        const dy = projectedNodes[i].py - projectedNodes[j].py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 75) {
          edges.push({
            id: `edge_${i}_${j}`,
            x1: projectedNodes[i].px,
            y1: projectedNodes[i].py,
            x2: projectedNodes[j].px,
            y2: projectedNodes[j].py,
            color: projectedNodes[i].color,
          });
        }
      }
    }
    return edges;
  }, [projectedNodes]);

  const selectedNode = topology.find((n) => n.id === selectedNodeId) || hoveredNode;

  const filteredProjectedNodes = projectedNodes.filter((n) => {
    if (filterLobe === "ALL") return true;
    return n.lobe === filterLobe;
  });

  return (
    <div className="brain-analytics-graph" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Top Analytics KPI Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))",
          gap: "1.4rem",
        }}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            borderRadius: "var(--radius-md)",
            padding: "1.4rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "1.15rem", color: "#94a3b8", fontWeight: 600 }}>
              Cortical Neural Density
            </span>
            <Activity size={16} color="#38bdf8" />
          </div>
          <strong style={{ fontSize: "2.2rem", color: "#f8fafc" }}>
            {metrics?.neuronCount || topology.length} Somas
          </strong>
          <span style={{ fontSize: "1.1rem", color: "#38bdf8" }}>
            {metrics?.axonsCount || Math.round(topology.length * 2.8)} Synaptic Axon Interconnects
          </span>
        </div>

        <div
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(192, 132, 252, 0.25)",
            borderRadius: "var(--radius-md)",
            padding: "1.4rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "1.15rem", color: "#94a3b8", fontWeight: 600 }}>
              White Matter Pathways
            </span>
            <Network size={16} color="#c084fc" />
          </div>
          <strong style={{ fontSize: "2.2rem", color: "#f8fafc" }}>
            {nervePathways.length} Nerve Tracts
          </strong>
          <span style={{ fontSize: "1.1rem", color: "#c084fc" }}>
            Corpus Callosum & Frontotemporal Highways
          </span>
        </div>

        <div
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(52, 211, 153, 0.25)",
            borderRadius: "var(--radius-md)",
            padding: "1.4rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "1.15rem", color: "#94a3b8", fontWeight: 600 }}>
              Latent Vector Resolution
            </span>
            <Database size={16} color="#34d399" />
          </div>
          <strong style={{ fontSize: "2.2rem", color: "#34d399" }}>
            1024-dim
          </strong>
          <span style={{ fontSize: "1.1rem", color: "#94a3b8" }}>
            Normalized Cosine Metric Space
          </span>
        </div>

        <div
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(251, 191, 36, 0.25)",
            borderRadius: "var(--radius-md)",
            padding: "1.4rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "1.15rem", color: "#94a3b8", fontWeight: 600 }}>
              Mean Synaptic Action Potential
            </span>
            <Zap size={16} color="#fbbf24" />
          </div>
          <strong style={{ fontSize: "2.2rem", color: "#fbbf24" }}>
            {Math.round(
              (topology.reduce((acc, curr) => acc + (curr.intensity || 0.5), 0) /
                totalTopologyCount) *
                100
            )}%
          </strong>
          <span style={{ fontSize: "1.1rem", color: "#94a3b8" }}>
            Active Synaptic Firing Capacity
          </span>
        </div>
      </div>

      {/* Main Two-Column Analytics Layout: 2D Interactive Network Graph & Detailed Lobe Distributions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(32rem, 1fr))",
          gap: "1.6rem",
        }}
      >
        {/* Left Column: Interactive Topological Neural Network Graph */}
        <div
          style={{
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.8rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.2rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc" }}>
                Interactive Neural Network Topology
              </h4>
              <span style={{ fontSize: "1.15rem", color: "var(--color-text-muted)" }}>
                2D Planar projection of synaptic clusters and semantic proximity
              </span>
            </div>

            {/* Lobe Filter Dropdown */}
            <select
              value={filterLobe}
              onChange={(e) => setFilterLobe(e.target.value)}
              style={{
                background: "var(--color-bg-primary)",
                color: "#f8fafc",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                padding: "0.4rem 0.8rem",
                fontSize: "1.15rem",
              }}
            >
              <option value="ALL">All Lobes ({projectedNodes.length})</option>
              <option value="Frontal (Executive)">Frontal (Executive)</option>
              <option value="Temporal (Episodic Memory)">Temporal (Episodic)</option>
              <option value="Parietal (Semantic Knowledge)">Parietal (Semantic)</option>
              <option value="Cerebellar (Reflexive Instincts)">Cerebellar (Reflexive)</option>
            </select>
          </div>

          {/* SVG Graph Canvas */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "36rem",
              background: "radial-gradient(circle at center, #0b1329 0%, #030712 100%)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 640 360" style={{ cursor: "crosshair" }}>
              {/* Connecting Synaptic Edges */}
              {networkEdges.map((edge) => (
                <line
                  key={edge.id}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={edge.color}
                  strokeWidth={1}
                  strokeOpacity={0.22}
                />
              ))}

              {/* Node Somas */}
              {filteredProjectedNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNode?.id === node.id;
                const r = isSelected || isHovered ? 7.5 : 4.5 + (node.intensity || 0.5) * 2.5;

                return (
                  <g
                    key={node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      if (onSelectNode) onSelectNode(node);
                    }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Glow halo */}
                    {(isSelected || isHovered) && (
                      <circle cx={node.px} cy={node.py} r={r + 6} fill={node.color} opacity={0.3} />
                    )}
                    <circle
                      cx={node.px}
                      cy={node.py}
                      r={r}
                      fill={node.color}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2 : 0.8}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip / Selected Node Detail Callout */}
            {selectedNode && (
              <div
                style={{
                  position: "absolute",
                  bottom: "1.2rem",
                  left: "1.2rem",
                  right: "1.2rem",
                  background: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem 1.4rem",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.8rem",
                  animation: "fadeIn 0.2s ease-out",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span
                      style={{
                        width: "0.8rem",
                        height: "0.8rem",
                        borderRadius: "50%",
                        backgroundColor:
                          selectedNode.type && TYPE_COLORS[selectedNode.type]
                            ? TYPE_COLORS[selectedNode.type]
                            : accentColor,
                      }}
                    />
                    <strong style={{ fontSize: "1.25rem", color: "#f8fafc" }}>
                      {selectedNode.label}
                    </strong>
                    <span className="badge badge--pill badge--tag" style={{ fontSize: "1rem" }}>
                      {selectedNode.lobe}
                    </span>
                  </div>
                  <span style={{ fontSize: "1.1rem", color: "#94a3b8" }}>
                    Action Potential: <strong>{Math.round((selectedNode.intensity || 0.5) * 100)}%</strong> • Cluster: {selectedNode.cluster}
                  </span>
                </div>

                {selectedNode.vectorPreview && (
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    {selectedNode.vectorPreview.slice(0, 4).map((v, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "1rem",
                          fontFamily: "monospace",
                          padding: "0.2rem 0.5rem",
                          background: "rgba(0, 0, 0, 0.5)",
                          borderRadius: "4px",
                          color: v >= 0 ? "#38bdf8" : "#fb7185",
                        }}
                      >
                        {v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Lobe Allocation & Activation Potential Graphs */}
        <div
          style={{
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.8rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.6rem",
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc" }}>
              Cognitive Lobe Distribution & Activation Spectrum
            </h4>
            <span style={{ fontSize: "1.15rem", color: "var(--color-text-muted)" }}>
              Functional partitioning of specialized knowledge across anatomical lobes
            </span>
          </div>

          {/* 1. Lobe Memory Distribution Progress Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {Object.entries(lobeCounts).map(([lobeName, count]) => {
              const pct = Math.round((count / totalTopologyCount) * 100);
              let color = "#38bdf8";
              if (lobeName.includes("Temporal")) color = "#34d399";
              else if (lobeName.includes("Parietal")) color = "#c084fc";
              else if (lobeName.includes("Cerebellar")) color = "#fbbf24";

              return (
                <div key={lobeName} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "1.2rem", color: "#f8fafc", fontWeight: 600 }}>
                      {lobeName}
                    </span>
                    <span style={{ fontSize: "1.15rem", color: color, fontWeight: 700 }}>
                      {count} Somas ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "0.8rem",
                      background: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "9999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        backgroundColor: color,
                        borderRadius: "9999px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Synaptic Activation Spectrum Bar */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "var(--radius-md)",
              padding: "1.4rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "1.2rem", color: "#f8fafc", fontWeight: 600 }}>
                Synaptic Firing Intensity Spectrum
              </span>
              <span style={{ fontSize: "1.1rem", color: "#94a3b8" }}>
                100% Normalized
              </span>
            </div>

            {/* Segmented Stacked Bar */}
            <div
              style={{
                width: "100%",
                height: "1.4rem",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                overflow: "hidden",
                gap: "2px",
              }}
            >
              <div
                style={{
                  width: `${activationTiers.highPct}%`,
                  background: "#38bdf8",
                  title: `High Intensity: ${activationTiers.high} nodes`,
                }}
              />
              <div
                style={{
                  width: `${activationTiers.medPct}%`,
                  background: "#34d399",
                  title: `Moderate: ${activationTiers.med} nodes`,
                }}
              />
              <div
                style={{
                  width: `${activationTiers.lowPct}%`,
                  background: "#fbbf24",
                  title: `Autonomic/Resting: ${activationTiers.low} nodes`,
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", color: "#94a3b8" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "0.8rem", height: "0.8rem", backgroundColor: "#38bdf8", borderRadius: "2px" }} />
                High &gt;75% ({activationTiers.highPct}%)
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "0.8rem", height: "0.8rem", backgroundColor: "#34d399", borderRadius: "2px" }} />
                Optimal 50-75% ({activationTiers.medPct}%)
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "0.8rem", height: "0.8rem", backgroundColor: "#fbbf24", borderRadius: "2px" }} />
                Resting &lt;50% ({activationTiers.lowPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainAnalyticsGraph;
