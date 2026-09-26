import React from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import type { RootState } from "../../store/store";
import Icon from "../../components/Icons";
import { FILTER_ISSUES } from "../../store/issues/issueSlice";

interface SearchFormData {
  search: string;
}

const Search: React.FC = () => {
  const { register, handleSubmit } = useForm<SearchFormData>();
  const dispatch = useAppDispatch();
  const backup = useSelector((state: RootState) => state.issueStore.backup);

  const handleSearchEvent = (data: SearchFormData) => {
    const val = (data.search || "").toLowerCase().trim();

    if (val.length > 0) {
      const updatedIssues = (backup || []).filter(
        (each) =>
          (each.title && each.title.toLowerCase().includes(val)) ||
          (each.content && each.content.toLowerCase().includes(val))
      );
      dispatch(FILTER_ISSUES({ issues: updatedIssues }));
    } else {
      dispatch(FILTER_ISSUES({ issues: backup || [] }));
    }
  };

  return (
    <form action="#" className="search" onSubmit={(e) => e.preventDefault()}>
      <input
        type="text"
        className="search__input"
        placeholder="Search your Issue"
        {...register("search")}
        onKeyUp={handleSubmit(handleSearchEvent)}
      />
      <button className="search__button" type="submit">
        <Icon iconName="magnifying-glass" styleName="search__icon" />
      </button>
    </form>
  );
};

export default Search;
