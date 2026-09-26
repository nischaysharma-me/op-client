import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { addIssue } from "../../store/issues/actions";
import Icon from "../../components/Icons";

const IssueForm: React.FC = () => {
  const [isIssueCreated, setIssueCreated] = useState(false);
  const dispatch = useAppDispatch();
  const [credentials, setCredentials] = useState({
    title: "",
    content: "",
  });

  const [notifier, setNotifier] = useState({
    isVisible: false,
    text: "",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const showNotification = (message: string) => {
    setNotifier({ isVisible: true, text: message });
    setTimeout(() => {
      setNotifier({ isVisible: false, text: "" });
    }, 2000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const success = await dispatch(
      addIssue(credentials.title, credentials.content)
    );
    if (success) {
      setIssueCreated(true);
    } else {
      showNotification("Failed to create issue");
    }
  };

  if (isIssueCreated) {
    return <Navigate to="/" />;
  } else {
    return (
      <div className="add-issue-box">
        <form action="#" onSubmit={handleSubmit} className="add-issue-form">
          <Link to="/" className="router-link">
            <button type="button" className="close__button">
              <Icon iconName="cross" styleName="close__icon" />
            </button>
          </Link>
          <h3>Create Issue...</h3>
          <input
            type="text"
            placeholder="Title"
            className="signup-form__input"
            name="title"
            value={credentials.title}
            onChange={handleChange}
            required
          />
          <textarea
            placeholder="Content"
            className="signup-form__input"
            rows={6}
            name="content"
            value={credentials.content}
            onChange={handleChange}
            required
          ></textarea>
          <button className="signup-form__button" type="submit">
            Create Issue
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

export default IssueForm;
