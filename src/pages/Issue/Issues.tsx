import React, { useEffect } from "react";
import Issue from "./Issue";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import type { RootState } from "../../store/store";
import { getIssues } from "../../store/issues/actions";

const Issues: React.FC = () => {
  const issues = useSelector((state: RootState) => state.issueStore.issues);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getIssues());
  }, [dispatch]);

  return (
    <ul className="issue-list">
      {issues.map((issue, index) => {
        return <Issue key={issue._id || index} hash={index + 1} issue={issue} />;
      })}
    </ul>
  );
};

export default Issues;
