import React, { MouseEvent } from "react";
import { IssueItem } from "../../store/issues/issueSlice";

interface FilterProps {
  issues: IssueItem[];
  handleIssues: (issues: IssueItem[]) => void;
}

const Filter: React.FC<FilterProps> = (props) => {
  const handleFeaturedFilter = (e: MouseEvent) => {
    e.preventDefault();
    const sortMethod = (a: IssueItem, b: IssueItem) =>
      (b.opinions?.length || 0) - (a.opinions?.length || 0);
    const filteredIssues = [...props.issues].sort(sortMethod);
    props.handleIssues([]);
    setTimeout(() => {
      props.handleIssues(filteredIssues);
    }, 1);
  };

  const handleNewestFilter = (e: MouseEvent) => {
    e.preventDefault();
    const sortMethod = (a: IssueItem, b: IssueItem) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    const filteredIssues = [...props.issues].sort(sortMethod);
    props.handleIssues([]);
    setTimeout(() => {
      props.handleIssues(filteredIssues);
    }, 1);
  };

  const handleOldestFilter = (e: MouseEvent) => {
    e.preventDefault();
    const sortMethod = (a: IssueItem, b: IssueItem) =>
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    const filteredIssues = [...props.issues].sort(sortMethod);
    props.handleIssues([]);
    setTimeout(() => {
      props.handleIssues(filteredIssues);
    }, 1);
  };

  const handleMostViewedFilter = (e: MouseEvent) => {
    e.preventDefault();
    const sortMethod = (a: IssueItem, b: IssueItem) => {
      const aLikes = (a.opinions || []).filter((op) => op.opinion === "like");
      const bLikes = (b.opinions || []).filter((op) => op.opinion === "dislike");
      return bLikes.length - aLikes.length;
    };
    const filteredIssues = [...props.issues].sort(sortMethod);
    props.handleIssues([]);
    setTimeout(() => {
      props.handleIssues(filteredIssues);
    }, 1);
  };

  return (
    <div className="filters-box">
      <ul className="filters-list">
        <li className="filters-list__filter" onClick={handleFeaturedFilter}>
          <a href="#top">Featured</a>
        </li>
        <li className="filters-list__filter" onClick={handleNewestFilter}>
          <a href="#top">Newest</a>
        </li>
        <li className="filters-list__filter" onClick={handleOldestFilter}>
          <a href="#top">Oldest</a>
        </li>
        <li className="filters-list__filter" onClick={handleMostViewedFilter}>
          <a href="#top">Most Viewed</a>
        </li>
      </ul>
    </div>
  );
};

export default Filter;
