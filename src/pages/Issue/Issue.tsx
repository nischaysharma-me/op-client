import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/Icons";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import type { RootState } from "../../store/store";
import { submitOpinion } from "../../store/issues/actions";
import { getUser } from "../../utils/localStorge";
import type { IssueItem } from "../../store/issues/issueSlice";

interface IssueProps {
  hash: number;
  issue: IssueItem;
}

const Issue: React.FC<IssueProps> = ({ hash, issue }) => {
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);
  const dispatch = useAppDispatch();
  const [responses, setResponses] = useState({
    userResponse: "",
    likes: 0,
    dislikes: 0,
  });

  if (!issue) return null;

  useEffect(() => {
    if (isAuth) {
      if (issue && issue.opinions && issue.opinions.length > 0) {
        const user = getUser();
        const userId = user?._id;
        const userOpinion = issue.opinions.filter(
          (each) => each.userId === userId
        );
        if (userOpinion.length > 0) {
          setResponses((prev) => ({
            ...prev,
            userResponse: userOpinion[0].opinion,
          }));
        }
      }
    } else {
      setResponses((prev) => ({
        ...prev,
        userResponse: "",
      }));
    }
  }, [isAuth, issue]);

  const getUserResponse = (): string => {
    const user = getUser();
    if (!user?._id || !issue.opinions) return "";
    const userOpinion = issue.opinions.filter(
      (each) => each.userId === user._id
    );
    if (userOpinion.length > 0) {
      return userOpinion[0].opinion;
    }
    return "";
  };

  const handleResponse = (response: string) => {
    dispatch(submitOpinion(issue._id, response));
  };

  const formatLikeclassName = (): string => {
    const plainStyle = "issue__response";
    return isAuth
      ? getUserResponse() === "like"
        ? `${plainStyle} active`
        : plainStyle
      : plainStyle;
  };

  const formatDislikeclassName = (): string => {
    const plainStyle = "issue__response";
    return isAuth
      ? getUserResponse() === "dislike"
        ? `${plainStyle} active`
        : plainStyle
      : plainStyle;
  };

  const handleOpinionCount = (response: string): number => {
    if (issue && issue.opinions && issue.opinions.length > 0) {
      const count = issue.opinions.filter((each) => each.opinion === response);
      return count.length;
    }
    return 0;
  };

  return (
    <li className="issue">
      <div className="issue__header">
        <h3 className="issue__title">
          <span className="issue__title--hash">#{hash} </span>
          <span className="issue__title--text">{issue.title}</span>
        </h3>
        <button className="issue__edit" type="button">
          <Icon iconName="pencil" styleName="issue__edit-icon" />
        </button>
      </div>
      <div className="issue__body">
        <p className="issue__content">{issue.content}</p>
        <form action="#" className="issue__response-box" onSubmit={(e) => e.preventDefault()}>
          <span className="issue__response-count">
            {handleOpinionCount("like")}
          </span>
          {isAuth ? (
            <button
              className={formatLikeclassName()}
              type="button"
              onClick={() => handleResponse("like")}
            >
              <Icon iconName="thumbs-up" styleName="issue__response-icon" />
              <span className="issue__response-text">Like</span>
            </button>
          ) : (
            <Link to="/login" className="router-link">
              <button className={formatLikeclassName()} type="button">
                <Icon iconName="thumbs-up" styleName="issue__response-icon" />
                <span className="issue__response-text">Like</span>
              </button>
            </Link>
          )}
          <span className="issue__response-count">
            {handleOpinionCount("dislike")}
          </span>
          {isAuth ? (
            <button
              type="button"
              className={formatDislikeclassName()}
              onClick={() => handleResponse("dislike")}
            >
              <Icon iconName="thumbs-down" styleName="issue__response-icon" />
              <span className="issue_response-text">Dislike</span>
            </button>
          ) : (
            <Link to="/login" className="router-link">
              <button type="button" className={formatDislikeclassName()}>
                <Icon
                  iconName="thumbs-down"
                  styleName="issue__response-icon"
                />
                <span className="issue_response-text">Dislike</span>
              </button>
            </Link>
          )}
        </form>
      </div>
    </li>
  );
};

export default Issue;
