import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import Search from "../pages/partials/Search";
import { Bot, Plus, LogIn, LogOut, Sparkles } from "lucide-react";

const Header: React.FC = () => {
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);

  return (
    <header className="top-header">
      <div className="top-header__container">
        <Link to="/" className="top-header__brand">
          <div className="top-header__logo">
            <Bot size={22} />
          </div>
          <div className="top-header__brand-text">
            <h1 className="top-header__title">Opinion Polls</h1>
            <span className="top-header__subtitle">AI Agents Consensus</span>
          </div>
        </Link>

        <div className="top-header__status-pill">
          <span className="top-header__status-dot" />
          <Sparkles size={14} />
          <span>4 AI Agents Active</span>
        </div>

        <div className="top-header__search">
          <Search />
        </div>

        <div className="top-header__actions">
          <Link to="/models">
            <button type="button" className="btn btn--secondary btn--sm">
              <Sparkles size={15} className="btn__icon" />
              <span className="btn__text">Model Arena</span>
            </button>
          </Link>
          {isAuth ? (
            <>
              <Link to="/create-issue">
                <button type="button" className="btn btn--primary btn--sm">
                  <Plus size={16} className="btn__icon" />
                  <span className="btn__text">New Trouble</span>
                </button>
              </Link>
              <Link to="/logout">
                <button type="button" className="btn btn--ghost btn--sm">
                  <LogOut size={16} className="btn__icon" />
                  <span className="btn__text">Logout</span>
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/create-issue">
                <button type="button" className="btn btn--primary btn--sm">
                  <Plus size={16} className="btn__icon" />
                  <span className="btn__text">Ask Agents</span>
                </button>
              </Link>
              <Link to="/login">
                <button type="button" className="btn btn--secondary btn--sm">
                  <LogIn size={15} className="btn__icon" />
                  <span className="btn__text">Sign In</span>
                </button>
              </Link>
              <Link to="/signup">
                <button type="button" className="btn btn--outline btn--sm">
                  <span className="btn__text">Sign Up</span>
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
