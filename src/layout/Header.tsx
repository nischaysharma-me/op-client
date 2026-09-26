import React from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icons";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import Search from "../pages/partials/Search";

const Header: React.FC = () => {
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);
  const topNavLinks = [
    { name: "About", link: "/about" },
    { name: "Company", link: "/company" },
    { name: "Plans", link: "/plans" },
  ];

  return (
    <header className="header">
      <div className="title-box">
        <Link to="/" className="router-link">
          <h1 className="title">
            <Icon iconName="stats" styleName="title__icon" />
            <span className="title--primary">Opinion Polls</span>
          </h1>
        </Link>
      </div>
      <div className="top-nav">
        <ul className="top-nav__menu">
          {topNavLinks.map((route) => (
            <li className="top-nav__item" key={route.name}>
              <Link to={route.link} className="router-link">
                {route.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Search />
      <form action="#" className="user-auth">
        {isAuth ? (
          <>
            <Link to="/create-issue" className="router-link">
              <button type="button" className="user-auth__button">
                Create Issue
              </button>
            </Link>
            <Link to="/logout" className="router-link">
              <button type="button" className="user-auth__button">
                Logout
              </button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="router-link">
              <button type="button" className="user-auth__button">
                Login
              </button>
            </Link>
            <Link to="/signup" className="router-link">
              <button type="button" className="user-auth__button">
                Signup
              </button>
            </Link>
          </>
        )}
      </form>
    </header>
  );
};

export default Header;
