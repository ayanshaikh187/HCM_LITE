import { createSlice } from "@reduxjs/toolkit";

const KEY = "hcm_user";
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
};

// user = { name, email, role: "admin" | "hr" | "employee" }
// TODO: after POST /auth/login, store the JWT and use the role returned by the server.
const slice = createSlice({
  name: "auth",
  initialState: { user: load() },
  reducers: {
    login(state, { payload }) {
      state.user = payload;
      try { localStorage.setItem(KEY, JSON.stringify(payload)); } catch { /* storage unavailable */ }
    },
    logout(state) {
      state.user = null;
      try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
    },
  },
});

export const { login, logout } = slice.actions;
export default slice.reducer;
