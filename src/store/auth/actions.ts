import { loginUser, logoutUser } from "./authSlice";

// Re-export modern thunks with backward-compatible names
export const login = loginUser;
export const logout = logoutUser;
