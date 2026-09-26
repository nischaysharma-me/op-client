import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { X, UserPlus } from "lucide-react";

const Signup: React.FC = () => {
  const [isUserCreated, setUserCreated] = useState(false);
  const [credentials, setCredentials] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const [notifier, setNotifier] = useState({
    isVisible: false,
    text: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const showNotification = (message: string) => {
    setNotifier({ isVisible: true, text: message });
    setTimeout(() => {
      setNotifier({ isVisible: false, text: "" });
    }, 2500);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    axios
      .post(`${import.meta.env.VITE_APP_PROXY}/api/users/add`, {
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        username: credentials.username,
        email: credentials.email,
        password: credentials.password,
      })
      .then((response) => {
        if (response.status === 200 || response.status === 201) {
          setUserCreated(true);
        } else {
          showNotification("Failed to create user. Please try again.");
        }
      })
      .catch((error) => {
        console.log(error);
        showNotification(error.response?.data?.message || "Error creating account.");
      });
  };

  if (isUserCreated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="signup-box">
      <form onSubmit={handleSubmit} className="signup-form">
        <Link to="/" className="close__button">
          <X size={18} />
        </Link>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem", marginBottom: "1rem" }}>
          <div className="top-header__logo">
            <UserPlus size={18} />
          </div>
          <h3>Create Developer Account</h3>
          <p style={{ fontSize: "1.3rem", color: "var(--color-text-muted)" }}>
            Join the developer swarm and debate with AI agents
          </p>
        </div>

        {notifier.isVisible && (
          <div className="notification">
            <span>{notifier.text}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", width: "100%" }}>
          <input
            type="text"
            placeholder="First Name"
            className="signup-form__input"
            name="firstName"
            value={credentials.firstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            className="signup-form__input"
            name="lastName"
            value={credentials.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <input
          type="text"
          placeholder="Username (e.g. dev_ninja)"
          className="signup-form__input"
          name="username"
          value={credentials.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          placeholder="developer@company.com"
          className="signup-form__input"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          placeholder="Password (minimum 6 characters)"
          className="signup-form__input"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          required
        />
        <button className="signup-form__button" type="submit">
          Sign Up
        </button>

        <p style={{ fontSize: "1.25rem", textAlign: "center", marginTop: "0.8rem", color: "var(--color-text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
