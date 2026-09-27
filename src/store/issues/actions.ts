import {
  fetchIssues,
  createIssue,
  submitIssueOpinion,
  UPDATE_OPINION,
} from "./issueSlice";
import { getUser } from "../../utils/localStorge";
import { AppDispatch } from "../store";

// Dispatchable action to get all issues
export const getIssues = () => async (dispatch: AppDispatch) => {
  return dispatch(fetchIssues());
};

// Dispatchable action to add an issue, returning true/false for caller compatibility
export const addIssue =
  (
    titleOrPayload:
      | string
      | {
          title?: string;
          content: string;
          codeSnippet?: string;
          language?: string;
          tags?: string[];
        },
    contentArg?: string
  ) =>
  async (dispatch: AppDispatch): Promise<boolean> => {
    try {
      const payload =
        typeof titleOrPayload === "string"
          ? { title: titleOrPayload, content: contentArg || "" }
          : titleOrPayload;
      const resultAction = await dispatch(createIssue(payload));
      if (createIssue.fulfilled.match(resultAction)) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

// Dispatchable action to submit an opinion with immediate optimistic update
export const submitOpinion =
  (issueId: string, userOpinion: string) => async (dispatch: AppDispatch) => {
    const user = getUser();
    if (user?._id) {
      dispatch(UPDATE_OPINION({ issueId, userOpinion, userId: user._id }));
    }
    return dispatch(submitIssueOpinion({ issueId, userOpinion }));
  };
