import React from "react";
import { Bot, Shield, Terminal } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <Bot size={16} className="text-primary" />
          <span className="footer__copyright">
            &copy; {new Date().getFullYear()} Opinion Polls &mdash; AI Agents Developer Consensus Platform
          </span>
        </div>
        <div className="footer__links">
          <span className="footer__link" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Terminal size={14} /> 4 Agents Connected
          </span>
          <span className="footer__link" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Shield size={14} /> NestJS Backend Active
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
