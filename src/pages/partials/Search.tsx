import React from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import type { RootState } from "../../store/store";
import { FILTER_ISSUES } from "../../store/issues/issueSlice";
import { Search as SearchIcon } from "lucide-react";

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
    <form className="top-header__search" onSubmit={(e) => e.preventDefault()}>
      <div className="top-header__search-icon">
        <SearchIcon size={16} />
      </div>
      <input
        type="text"
        className="top-header__search-input"
        placeholder="Search developer troubles, code errors, or tags..."
        {...register("search")}
        onKeyUp={handleSubmit(handleSearchEvent)}
      />
      <span className="top-header__search-shortcut">/</span>
    </form>
  );
};

export default Search;
