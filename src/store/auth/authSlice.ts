import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  isUserLoggedIn,
  getUser,
  clearCredentials,
  UserData,
} from "../../utils/localStorge";

export interface AuthState {
  isAuth: boolean;
  user: UserData | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  stat: string;
  token: string;
  user: UserData;
}

// Async thunk for logging in
export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_APP_PROXY}/api/auth/login`,
      credentials
    );
    const data = response.data;
    if (response.status === 200 && data.token) {
      localStorage.setItem("accessToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));
      return data;
    }
    return rejectWithValue("Invalid credentials");
  } catch (error: any) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Login failed. Please try again.";
    return rejectWithValue(message);
  }
});

// Async thunk for logging out
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  try {
    await axios.get(`${import.meta.env.VITE_APP_PROXY}/api/auth/logout`);
  } catch (error) {
    // Continue local cleanup even if server request fails
  }
  clearCredentials();
  return null;
});

const initialState: AuthState = {
  isAuth: isUserLoggedIn(),
  user: getUser(),
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    SET_IS_AUTH(state, action: PayloadAction<boolean>) {
      state.isAuth = action.payload;
    },
    SET_USER(state, action: PayloadAction<UserData | null>) {
      state.user = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuth = false;
        state.user = null;
        state.error = (action.payload as string) || "Login failed";
      })
      // logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuth = false;
        state.user = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { SET_IS_AUTH, SET_USER, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
