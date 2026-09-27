import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { getAuthToken, getUser } from "../../utils/localStorge";

export interface Opinion {
  userId: string;
  opinion: string;
}

export interface IssueItem {
  _id: string;
  title: string;
  content: string;
  creator: string;
  opinions?: Opinion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IssuesState {
  issues: IssueItem[];
  backup: IssueItem[];
  loading: boolean;
  error: string | null;
}

// Async thunk to fetch all issues
export const fetchIssues = createAsyncThunk<
  IssueItem[],
  void,
  { rejectValue: string }
>("issues/fetchIssues", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_APP_PROXY}/api/issues/view`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthToken(),
        },
      }
    );
    return (response.data.issues as IssueItem[]) || [];
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load issues"
    );
  }
});

// Async thunk to create a new issue
export const createIssue = createAsyncThunk<
  IssueItem,
  {
    title?: string;
    content: string;
    codeSnippet?: string;
    language?: string;
    tags?: string[];
  },
  { rejectValue: string }
>("issues/createIssue", async (payload, { rejectWithValue }) => {
  try {
    const user = getUser();
    const newIssue = {
      title: payload.title,
      content: payload.content,
      codeSnippet: payload.codeSnippet,
      language: payload.language,
      tags: payload.tags,
      creator: user?._id || "",
    };
    const response = await axios.post(
      `${import.meta.env.VITE_APP_PROXY}/api/issues/add`,
      newIssue,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthToken(),
        },
      }
    );
    return response.data.issue as IssueItem;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to create issue"
    );
  }
});

// Async thunk to submit an opinion (like/dislike)
export const submitIssueOpinion = createAsyncThunk<
  { issueId: string; userId: string; userOpinion: string },
  { issueId: string; userOpinion: string },
  { rejectValue: string }
>(
  "issues/submitOpinion",
  async ({ issueId, userOpinion }, { rejectWithValue }) => {
    try {
      const user = getUser();
      const userId = user?._id || "";
      await axios.put(
        `${import.meta.env.VITE_APP_PROXY}/api/issues/update/opinion/${issueId}`,
        { userId, opinion: userOpinion },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuthToken(),
          },
        }
      );
      return { issueId, userId, userOpinion };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit opinion"
      );
    }
  }
);

const updateOpinionInList = (
  issuesList: IssueItem[],
  issueId: string,
  userId: string,
  userOpinion: string
): IssueItem[] => {
  return issuesList.map((issue) => {
    if (issue._id === issueId) {
      const opinions = issue.opinions ? [...issue.opinions] : [];
      const existingOpinionIndex = opinions.findIndex(
        (op) => op.userId === userId
      );

      if (existingOpinionIndex !== -1) {
        opinions[existingOpinionIndex] = {
          ...opinions[existingOpinionIndex],
          opinion: userOpinion,
        };
      } else {
        opinions.push({ userId, opinion: userOpinion });
      }
      return { ...issue, opinions };
    }
    return issue;
  });
};

const initialState: IssuesState = {
  issues: [],
  backup: [],
  loading: false,
  error: null,
};

export const issueSlice = createSlice({
  name: "issues",
  initialState,
  reducers: {
    ADD_ISSUES(state, action: PayloadAction<{ issues: IssueItem[] }>) {
      const newIssues = action.payload.issues || [];
      state.issues = newIssues;
      state.backup = newIssues;
    },
    ADD_ISSUE(state, action: PayloadAction<{ issue: IssueItem }>) {
      const issue = action.payload.issue;
      state.issues.push(issue);
      state.backup.push(issue);
    },
    EDIT_ISSUE(state, action: PayloadAction<{ issue: IssueItem }>) {
      const updated = action.payload.issue;
      state.issues = state.issues.map((i) =>
        i._id === updated._id ? updated : i
      );
      state.backup = state.backup.map((i) =>
        i._id === updated._id ? updated : i
      );
    },
    UPDATE_OPINION(
      state,
      action: PayloadAction<{
        userOpinion: string;
        userId: string;
        issueId: string;
      }>
    ) {
      const { userOpinion, userId, issueId } = action.payload;
      state.issues = updateOpinionInList(
        state.issues,
        issueId,
        userId,
        userOpinion
      );
      state.backup = updateOpinionInList(
        state.backup,
        issueId,
        userId,
        userOpinion
      );
    },
    DELETE_ISSUE(state, action: PayloadAction<{ issue?: { _id: string }; id?: string }>) {
      const id = action.payload.issue?._id || action.payload.id;
      state.issues = state.issues.filter((i) => i._id !== id);
      state.backup = state.backup.filter((i) => i._id !== id);
    },
    BACKUP_ISSUES(state) {
      state.backup = [...state.issues];
    },
    FILTER_ISSUES(state, action: PayloadAction<{ issues: IssueItem[] }>) {
      state.issues = action.payload.issues;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchIssues
      .addCase(fetchIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = action.payload;
        state.backup = action.payload;
        state.error = null;
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to load issues";
      })
      // createIssue
      .addCase(createIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createIssue.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.issues.push(action.payload);
          state.backup.push(action.payload);
        }
      })
      .addCase(createIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create issue";
      })
      // submitIssueOpinion
      .addCase(submitIssueOpinion.fulfilled, (state, action) => {
        const { issueId, userId, userOpinion } = action.payload;
        state.issues = updateOpinionInList(
          state.issues,
          issueId,
          userId,
          userOpinion
        );
        state.backup = updateOpinionInList(
          state.backup,
          issueId,
          userId,
          userOpinion
        );
      });
  },
});

export const {
  ADD_ISSUES,
  ADD_ISSUE,
  EDIT_ISSUE,
  DELETE_ISSUE,
  BACKUP_ISSUES,
  UPDATE_OPINION,
  FILTER_ISSUES,
} = issueSlice.actions;

export const filterIssues = FILTER_ISSUES;
export const updateOpinion = UPDATE_OPINION;

export default issueSlice.reducer;
