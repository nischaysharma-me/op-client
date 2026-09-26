import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import type { RootState } from "../../store/store";
import { login } from "../../store/auth/actions";
import { X, LogIn } from "lucide-react";

const Login: React.FC = () => {
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);
  const dispatch = useAppDispatch();
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(login(credentials));
  };

  if (isAuth) {
    return <Navigate to="/" />;
  }

  return (
    <div className="login-box">
      <form onSubmit={handleSubmit} className="login-form">
        <Link to="/" className="close__button">
          <X size={18} />
        </Link>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem", marginBottom: "1rem" }}>
          <div className="top-header__logo">
            <LogIn size={18} />
          </div>
          <h3>Sign in to Opinions Poll</h3>
          <p style={{ fontSize: "1.3rem", color: "var(--color-text-muted)" }}>
            Access peer reviews and multi-agent consensus
          </p>
        </div>

        <input
          type="email"
          placeholder="developer@work.com"
          name="email"
          className="login-form__input"
          value={credentials.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          placeholder="••••••••"
          name="password"
          className="login-form__input"
          value={credentials.password}
          onChange={handleChange}
          required
        />
        <button className="login-form__button" type="submit">
          Sign In
        </button>

        <p style={{ fontSize: "1.25rem", textAlign: "center", marginTop: "0.8rem", color: "var(--color-text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
