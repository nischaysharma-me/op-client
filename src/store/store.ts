import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import issueReducer from "./issues/issueSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    issueStore: issueReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
