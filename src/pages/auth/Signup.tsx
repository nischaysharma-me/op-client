import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import Icon from "../../components/Icons";
import axios from "axios";

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

  const handleClearField = () => {
    setCredentials({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
    });
  };

  const showNotification = (message: string) => {
    setNotifier({ isVisible: true, text: message });
    setTimeout(() => {
      setNotifier({ isVisible: false, text: "" });
    }, 2000);
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
        switch (response.status) {
          case 200:
            handleClearField();
            setUserCreated(true);
            break;
          default:
            showNotification("Err! Try Again");
        }
      })
      .catch((error) => {
        console.log(error);
        showNotification("Error! Try Again");
      });
  };

  if (isUserCreated) {
    return <Navigate to="/" />;
  } else {
    return (
      <div className="signup-box">
        <form action="#" onSubmit={handleSubmit} className="signup-form">
          <Link to="/" className="router-link">
            <button type="button" className="close__button">
              <Icon iconName="cross" styleName="close__icon" />
            </button>
          </Link>
          <h3>Sign in Here...</h3>
          <input
            type="text"
            placeholder="First Name"
            className="signup-form__input"
            name="firstName"
            value={credentials.firstName}
            onChange={handleChange}
          />
          <input
            type="text"
            placeholder="Last name"
            className="signup-form__input"
            name="lastName"
            value={credentials.lastName}
            onChange={handleChange}
          />
          <input
            type="text"
            placeholder="Username"
            className="signup-form__input"
            name="username"
            value={credentials.username}
            onChange={handleChange}
          />
          <input
            type="email"
            placeholder="Email"
            className="signup-form__input"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            placeholder="password"
            className="signup-form__input"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
          />
          <button className="signup-form__button" type="submit">
            sign up
          </button>
          {notifier.isVisible ? (
            <span className="notification">{notifier.text}</span>
          ) : (
            <></>
          )}
        </form>
      </div>
    );
  }
};

export default Signup;
