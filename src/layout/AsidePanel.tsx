import React from "react";
import { Activity, ShieldAlert, Cpu, Sparkles } from "lucide-react";

const AsidePanel: React.FC = () => {
  return (
    <aside className="aside-panel">
      {/* Consensus Engine Meter */}
      <div className="aside-panel__card aside-panel__card--highlight">
        <div className="aside-panel__card-header">
          <div className="aside-panel__card-title">
            <Activity size={18} className="text-primary" />
            <span>AI Consensus Meter</span>
          </div>
          <span className="badge badge--resolved badge--pill">Active</span>
        </div>
        <p className="aside-panel__card-desc">
          Live multi-agent convergence across current debugging sessions.
        </p>
        <div className="aside-panel__consensus-box">
          <div className="aside-panel__consensus-meta">
            <span className="aside-panel__consensus-label">Swarm Agreement</span>
            <span className="aside-panel__consensus-value">94.2%</span>
          </div>
          <div className="aside-panel__meter-bar">
            <div className="aside-panel__meter-fill" style={{ width: "94.2%" }} />
          </div>
        </div>
      </div>

      {/* Swarm Performance Metrics */}
      <div className="aside-panel__card">
        <div className="aside-panel__card-header">
          <div className="aside-panel__card-title">
            <Cpu size={18} />
            <span>Swarm Telemetry</span>
          </div>
        </div>
        <div className="aside-panel__stats-grid">
          <div className="aside-panel__stat-box">
            <span className="aside-panel__stat-number">4</span>
            <span className="aside-panel__stat-caption">Active Agents</span>
          </div>
          <div className="aside-panel__stat-box">
            <span className="aside-panel__stat-number">&lt; 35s</span>
            <span className="aside-panel__stat-caption">Avg Cross-Exam</span>
          </div>
          <div className="aside-panel__stat-box">
            <span className="aside-panel__stat-number">98.4%</span>
            <span className="aside-panel__stat-caption">Resolution Rate</span>
          </div>
          <div className="aside-panel__stat-box">
            <span className="aside-panel__stat-number">1,420+</span>
            <span className="aside-panel__stat-caption">Opinions Cast</span>
          </div>
        </div>
      </div>

      {/* Multi-Agent Protocol Guide */}
      <div className="aside-panel__card">
        <div className="aside-panel__card-header">
          <div className="aside-panel__card-title">
            <Sparkles size={18} />
            <span>Agent Protocol</span>
          </div>
        </div>
        <div className="aside-panel__protocol-list">
          <div className="aside-panel__protocol-item">
            <span className="aside-panel__protocol-num">1</span>
            <span>Post code trouble or stack trace</span>
          </div>
          <div className="aside-panel__protocol-item">
            <span className="aside-panel__protocol-num">2</span>
            <span>AI agents cross-question missing variables</span>
          </div>
          <div className="aside-panel__protocol-item">
            <span className="aside-panel__protocol-num">3</span>
            <span>Agents debate trade-offs & vote opinions</span>
          </div>
          <div className="aside-panel__protocol-item">
            <span className="aside-panel__protocol-num">4</span>
            <span>Developer accepts optimal solution</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AsidePanel;
