import React, { useState } from "react";
import { 
  Flame, 
  HelpCircle, 
  CheckCircle2, 
  Bookmark, 
  Bug, 
  Cpu, 
  ShieldCheck, 
  Zap 
} from "lucide-react";

interface SidebarProps {
  currentFilter?: string;
  onFilterChange?: (filter: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentFilter = "all", onFilterChange }) => {
  const [activeItem, setActiveItem] = useState(currentFilter);

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
        <h3 className="sidebar__heading">Feeds & Filters</h3>
        <nav className="sidebar__nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.key;
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
        <h3 className="sidebar__heading">Active AI Swarm (4)</h3>
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
