import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import Icon from "../../components/Icons";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import type { RootState } from "../../store/store";
import { login } from "../../store/auth/actions";

const Login: React.FC = () => {
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);
  const dispatch = useAppDispatch();
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleClearField = () => {
    setCredentials({ email: "", password: "" });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(login(credentials));
    handleClearField();
  };

  if (!isAuth) {
    return (
      <div className="login-box">
        <form action="" onSubmit={handleSubmit} className="login-form">
          <button type="button" className="close__button">
            <Link to="/">
              <Icon iconName="cross" styleName="close__icon" />
            </Link>
          </button>
          <h3>Log in Here...</h3>
          <input
            type="email"
            placeholder="email"
            name="email"
            className="login-form__input"
            value={credentials.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            placeholder="password"
            name="password"
            className="login-form__input"
            value={credentials.password}
            onChange={handleChange}
            required
          />
          <button className="login-form__button" type="submit">
            Login
          </button>
        </form>
      </div>
    );
  } else {
    return <Navigate to="/" />;
  }
};

export default Login;
