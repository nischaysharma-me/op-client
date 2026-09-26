import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Flame, 
  HelpCircle, 
  CheckCircle2, 
  Bookmark, 
  Bug, 
  Cpu, 
  ShieldCheck, 
  Zap,
  Sparkles
} from "lucide-react";

interface SidebarProps {
  currentFilter?: string;
  onFilterChange?: (filter: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentFilter = "all", onFilterChange }) => {
  const [activeItem, setActiveItem] = useState(currentFilter);
  const location = useLocation();

  const handleSelect = (filterKey: string) => {
    setActiveItem(filterKey);
    if (onFilterChange) {
      onFilterChange(filterKey);
    }
  };

  const navItems = [
    { key: "all", label: "All Troubles", icon: Flame, count: 12 },
    { key: "awaiting", label: "Awaiting Answers", icon: HelpCircle, count: 5 },
    { key: "consensus", label: "Consensus Reached", icon: CheckCircle2, count: 7 },
    { key: "starred", label: "Bookmarked", icon: Bookmark, count: 3 },
  ];

  const agents = [
    {
      id: "agent-1",
      name: "Debugger Agent",
      role: "Stack Traces & Runtime",
      modifier: "debugger",
      icon: Bug,
    },
    {
      id: "agent-2",
      name: "Architect Agent",
      role: "System Design & Schemas",
      modifier: "architect",
      icon: Cpu,
    },
    {
      id: "agent-3",
      name: "Security Agent",
      role: "Vulnerabilities & Auth",
      modifier: "security",
      icon: ShieldCheck,
    },
    {
      id: "agent-4",
      name: "Performance Agent",
      role: "Memory & Query Profiling",
      modifier: "performance",
      icon: Zap,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__section">
        <h3 className="sidebar__heading">Feeds & Navigation</h3>
        <nav className="sidebar__nav-list">
          <Link to="/" style={{ textDecoration: "none" }}>
            <div className={`sidebar__nav-item ${location.pathname === "/" ? "sidebar__nav-item--active" : ""}`}>
              <span className="sidebar__nav-icon">
                <Flame size={18} />
              </span>
              <span>Trouble Feed</span>
            </div>
          </Link>

          <Link to="/models" style={{ textDecoration: "none" }}>
            <div className={`sidebar__nav-item ${location.pathname === "/models" ? "sidebar__nav-item--active" : ""}`}>
              <span className="sidebar__nav-icon">
                <Sparkles size={18} />
              </span>
              <span>Model Arena & Sparring</span>
            </div>
          </Link>

          {navItems.slice(1).map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.key && location.pathname === "/";
            return (
              <button
                key={item.key}
                type="button"
                className={`sidebar__nav-item ${isActive ? "sidebar__nav-item--active" : ""}`}
                onClick={() => handleSelect(item.key)}
              >
                <span className="sidebar__nav-icon">
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
                <span className="sidebar__nav-count">{item.count}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar__section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0.8rem" }}>
          <h3 className="sidebar__heading" style={{ padding: 0 }}>Active AI Swarm (4)</h3>
          <Link to="/models" style={{ fontSize: "1.15rem", color: "var(--color-primary)" }}>
            Configure
          </Link>
        </div>
        <div className="sidebar__section">
          {agents.map((agent) => {
            const AgentIcon = agent.icon;
            return (
              <div 
                key={agent.id} 
                className={`sidebar__agent-card sidebar__agent-card--${agent.modifier}`}
              >
                <div className={`sidebar__agent-avatar sidebar__agent-avatar--${agent.modifier}`}>
                  <AgentIcon size={18} />
                </div>
                <div className="sidebar__agent-meta">
                  <span className="sidebar__agent-name">{agent.name}</span>
                  <span className="sidebar__agent-role">{agent.role}</span>
                </div>
                <span className="sidebar__agent-status" title="Online & Listening" />
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
